package com.disaster.management.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;

/**
 * Service for handling file operations in AWS S3.
 * Uses EC2 IAM Role credentials (no keys needed).
 */
@Service
public class S3Service {

    @Autowired
    private AmazonS3 s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.profile-images-folder}")
    private String profileImagesFolder;

    /**
     * Uploads a profile image to S3 inside the configured folder.
     *
     * @param file   MultipartFile uploaded from frontend
     * @param userId User ID for filename generation
     * @return Public URL of the uploaded image
     */
    public String uploadProfileImage(MultipartFile file, String userId) {
        try {
            // Create a unique file key: profile-images/users/user_123_1234567890.jpg
            String fileKey = profileImagesFolder + "user_" + userId + "_" + System.currentTimeMillis() + ".jpg";

            File tempFile = convertMultiPartFileToFile(file);

            // Upload file
            s3Client.putObject(new PutObjectRequest(bucketName, fileKey, tempFile));

            // Clean up
            if (tempFile.exists()) tempFile.delete();

            String fileUrl = s3Client.getUrl(bucketName, fileKey).toString();
            System.out.println("✅ Uploaded profile image: " + fileUrl);

            return fileUrl;
        } catch (Exception e) {
            System.err.println("❌ Error uploading profile image: " + e.getMessage());
            throw new RuntimeException("Failed to upload profile image", e);
        }
    }

    /**
     * Uploads any file to a specific folder in S3.
     *
     * @param file   MultipartFile to upload
     * @param folder Folder path in S3 (e.g., "temp-uploads", "emergency-files")
     * @return Public URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            File tempFile = convertMultiPartFileToFile(file);
            String fileKey = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

            s3Client.putObject(new PutObjectRequest(bucketName, fileKey, tempFile));

            if (tempFile.exists()) tempFile.delete();

            String fileUrl = s3Client.getUrl(bucketName, fileKey).toString();
            System.out.println("✅ Uploaded file: " + fileUrl);

            return fileUrl;
        } catch (Exception e) {
            System.err.println("❌ Error uploading file: " + e.getMessage());
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    /**
     * Deletes a file from S3 using its full URL.
     *
     * @param fileUrl Full S3 file URL (e.g. https://bucket.s3.region.amazonaws.com/profile-images/users/file.jpg)
     * @return Success message
     */
    public String deleteFile(String fileUrl) {
        try {
            // Extract S3 key correctly (includes folder path)
            String fileKey = fileUrl.substring(fileUrl.indexOf(bucketName) + bucketName.length() + 1);

            s3Client.deleteObject(bucketName, fileKey);
            System.out.println("✅ Deleted file: " + fileKey);

            return fileKey + " removed successfully.";
        } catch (Exception e) {
            System.err.println("❌ Error deleting file: " + e.getMessage());
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    /**
     * Converts MultipartFile to a temporary File for upload.
     */
    private File convertMultiPartFileToFile(MultipartFile file) {
        File convertedFile = new File(System.getProperty("java.io.tmpdir") + "/" + file.getOriginalFilename());
        try (FileOutputStream fos = new FileOutputStream(convertedFile)) {
            fos.write(file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Error converting multipart file to file", e);
        }
        return convertedFile;
    }
}
