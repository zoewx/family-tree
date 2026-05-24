package com.familytree.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class StorageService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.max-size:1048576}")
    private long maxSize;

    @Value("${app.r2.endpoint:}")
    private String r2Endpoint;

    @Value("${app.r2.access-key:}")
    private String r2AccessKey;

    @Value("${app.r2.secret-key:}")
    private String r2SecretKey;

    @Value("${app.r2.bucket:family-tree-uploads}")
    private String r2Bucket;

    @Value("${app.r2.public-url:}")
    private String r2PublicUrl;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (isR2Configured()) {
            s3Client = S3Client.builder()
                    .endpointOverride(URI.create(r2Endpoint))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(r2AccessKey, r2SecretKey)))
                    .region(Region.of("auto"))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build())
                    .build();
            log.info("R2 storage initialized with bucket: {}", r2Bucket);
        } else {
            try {
                Path path = Paths.get(uploadDir);
                if (!Files.exists(path)) {
                    Files.createDirectories(path);
                    log.info("Created upload directory: {}", path.toAbsolutePath());
                }
            } catch (IOException e) {
                throw new RuntimeException("Could not create upload directory", e);
            }
        }
    }

    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds limit of 1MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        String originalName = file.getOriginalFilename();
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        String filename = UUID.randomUUID() + ext;

        if (isR2Configured()) {
            String key = folder + "/" + filename;
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(r2Bucket)
                            .key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
            return r2PublicUrl + "/" + key;
        } else {
            Path folderPath = Paths.get(uploadDir, folder);
            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
            }
            Path target = folderPath.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + folder + "/" + filename;
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null) return;
        if (isR2Configured() && fileUrl.startsWith(r2PublicUrl)) {
            String key = fileUrl.substring(r2PublicUrl.length() + 1);
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(r2Bucket)
                        .key(key)
                        .build());
            } catch (Exception e) {
                log.warn("Failed to delete R2 object: {}", key, e);
            }
        } else if (fileUrl.startsWith("/uploads/")) {
            try {
                String relativePath = fileUrl.substring("/uploads/".length());
                Path path = Paths.get(uploadDir, relativePath);
                Files.deleteIfExists(path);
            } catch (IOException e) {
                log.warn("Failed to delete file: {}", fileUrl, e);
            }
        }
    }

    private boolean isR2Configured() {
        return r2Endpoint != null && !r2Endpoint.isBlank()
                && r2AccessKey != null && !r2AccessKey.isBlank()
                && r2SecretKey != null && !r2SecretKey.isBlank();
    }
}
