package com.disaster.management.controller;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.securitytoken.AWSSecurityTokenService;
import com.amazonaws.services.securitytoken.AWSSecurityTokenServiceClientBuilder;
import com.amazonaws.services.securitytoken.model.GetCallerIdentityRequest;
import com.amazonaws.services.securitytoken.model.GetCallerIdentityResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * TEMPORARY Diagnostic Controller for AWS Credentials
 * 
 * This controller helps diagnose AWS credential issues by checking:
 * 1. Which credentials are being used
 * 2. Whether they are valid
 * 3. What IAM principal (user/role) they belong to
 * 
 * ⚠️ SECURITY WARNING: Remove this controller after troubleshooting!
 */
@RestController
@RequestMapping("/aws-diagnostic")
@CrossOrigin(origins = "*")
public class AwsCredentialsCheckController {

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    /**
     * Check which AWS credentials are being used
     * 
     * GET /api/aws-diagnostic/check-credentials
     * 
     * Response shows:
     * - Whether credentials are found
     * - IAM Account ID, User ID, and ARN
     * - Bucket name configured
     * - Region configured
     */
    @GetMapping("/check-credentials")
    public ResponseEntity<?> checkCredentials() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get the credentials provider chain
            AWSCredentialsProvider credentialsProvider = DefaultAWSCredentialsProviderChain.getInstance();
            
            // Try to get credentials
            AWSCredentials credentials = credentialsProvider.getCredentials();
            
            // Mask the access key (show only first 4 and last 4 characters)
            String accessKeyId = credentials.getAWSAccessKeyId();
            String maskedAccessKey = maskAccessKey(accessKeyId);
            
            response.put("credentialsFound", true);
            response.put("accessKeyId", maskedAccessKey);
            response.put("credentialsType", credentials.getClass().getSimpleName());
            
            // Check environment variables (without printing secrets)
            String envAccessKey = System.getenv("AWS_ACCESS_KEY_ID");
            String envSecretKey = System.getenv("AWS_SECRET_ACCESS_KEY");
            
            response.put("envVarsPresent", Map.of(
                "AWS_ACCESS_KEY_ID", envAccessKey != null ? "SET (length: " + envAccessKey.length() + ")" : "NOT SET",
                "AWS_SECRET_ACCESS_KEY", envSecretKey != null ? "SET (length: " + envSecretKey.length() + ")" : "NOT SET"
            ));
            
            // Try to call AWS STS to get caller identity
            try {
                AWSSecurityTokenService stsClient = AWSSecurityTokenServiceClientBuilder.standard()
                        .withRegion(region)
                        .withCredentials(credentialsProvider)
                        .build();
                
                GetCallerIdentityResult callerIdentity = stsClient.getCallerIdentity(new GetCallerIdentityRequest());
                
                response.put("validCredentials", true);
                response.put("awsAccountId", callerIdentity.getAccount());
                response.put("awsUserId", callerIdentity.getUserId());
                response.put("awsArn", callerIdentity.getArn());
                
            } catch (Exception stsException) {
                response.put("validCredentials", false);
                response.put("stsError", stsException.getMessage());
                response.put("errorType", stsException.getClass().getSimpleName());
            }
            
            // Add configuration info
            response.put("configuration", Map.of(
                "region", region,
                "bucketName", bucketName
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("credentialsFound", false);
            response.put("error", e.getMessage());
            response.put("errorType", e.getClass().getSimpleName());
            
            // Check if using instance profile
            String instanceProfileCheck = checkInstanceProfile();
            response.put("instanceProfile", instanceProfileCheck);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Quick health check with basic info
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "diagnostic-endpoint-active");
        response.put("timestamp", System.currentTimeMillis());
        response.put("warning", "This is a diagnostic endpoint - remove after troubleshooting!");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Mask access key to show only first 4 and last 4 characters
     */
    private String maskAccessKey(String accessKey) {
        if (accessKey == null || accessKey.length() < 8) {
            return "INVALID_KEY";
        }
        
        String first4 = accessKey.substring(0, 4);
        String last4 = accessKey.substring(accessKey.length() - 4);
        int maskedLength = accessKey.length() - 8;
        
        return first4 + "*".repeat(maskedLength) + last4;
    }

    /**
     * Check if running on EC2 with instance profile
     */
    private String checkInstanceProfile() {
        try {
            // Try to access EC2 metadata service
            String metadataUrl = System.getenv("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI");
            if (metadataUrl != null) {
                return "Running in ECS with task role";
            }
            
            // Check for EC2 instance metadata
            return "Check EC2 instance IAM role in AWS Console";
            
        } catch (Exception e) {
            return "Unable to determine instance profile: " + e.getMessage();
        }
    }
}
