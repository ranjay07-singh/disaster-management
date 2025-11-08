package com.disaster.management.controller;

import com.disaster.management.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * File Upload Controller
 * Handles file uploads to AWS S3
 * Endpoint: POST /api/files/upload
 * Note: context-path is /api, so just use /files here
 */
@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Autowired
    private S3Service s3Service;

    /**
     * Upload file endpoint - handles profile images and other files
     * 
     * URL: POST http://107.22.156.168:8080/api/files/upload
     * 
     * Expected FormData fields:
     * - file: The image file (required)
     * - userId: User ID (required)
     * - type: File type - "profile" or "general" (optional, defaults to "general")
     * 
     * Example Response:
     * {
     *   "success": true,
     *   "imageUrl": "https://disaster-management-files.s3.us-east-1.amazonaws.com/profile-images/users/user_123_1234567890.jpg",
     *   "message": "Profile image uploaded successfully"
     * }
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId,
            @RequestParam(value = "type", defaultValue = "general") String type) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("File is empty"));
            }

            // Validate file size (max 10MB)
            long maxSize = 10 * 1024 * 1024; // 10MB
            if (file.getSize() > maxSize) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("File size exceeds 10MB limit"));
            }

            String fileUrl;
            String message;
            
            // Route to correct S3 folder based on type
            if ("profile".equals(type)) {
                // Uploads to: disaster-management-files/profile-images/users/
                fileUrl = s3Service.uploadProfileImage(file, userId);
                message = "Profile image uploaded successfully";
            } else {
                // Uploads to: disaster-management-files/temp-uploads/
                fileUrl = s3Service.uploadFile(file, "temp-uploads");
                message = "File uploaded successfully";
            }
            
            // Success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("imageUrl", fileUrl);
            response.put("message", message);
            
            System.out.println("✅ Upload successful for userId: " + userId + " | Type: " + type);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Upload failed: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Upload failed: " + e.getMessage()));
        }
    }

    /**
     * Delete file from S3
     * 
     * DELETE /api/files/delete?fileUrl={url}
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFile(@RequestParam("fileUrl") String fileUrl) {
        try {
            String result = s3Service.deleteFile(fileUrl);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Delete failed: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Delete failed: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint for file upload service
     * 
     * GET /api/files/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "File Upload Service");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Helper method to create error response
     */
    private Map<String, Object> createErrorResponse(String errorMessage) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", errorMessage);
        return response;
    }
}

