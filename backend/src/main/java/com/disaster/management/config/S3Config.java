package com.disaster.management.config;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AWS S3 Configuration
 * 
 * This class configures the Amazon S3 client with IAM credentials.
 * It uses DefaultAWSCredentialsProviderChain which checks credentials in the following order:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. Java system properties
 * 3. AWS credentials file (~/.aws/credentials)
 * 4. EC2 instance profile (IAM Role) — recommended for production
 */
@Configuration
public class S3Config {

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    /**
     * Creates and configures the Amazon S3 client bean.
     * Automatically uses the EC2 IAM Role credentials if available.
     *
     * @return Configured AmazonS3 client instance
     */
    @Bean
    public AmazonS3 amazonS3() {
        return AmazonS3ClientBuilder.standard()
                .withRegion(region) // region from application.properties or default
                .withCredentials(DefaultAWSCredentialsProviderChain.getInstance())
                .build();
    }
}
