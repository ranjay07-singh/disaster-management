package com.disaster.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/volunteers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VolunteerController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllVolunteers() {
        Map<String, Object> response = new HashMap<>();
        
        // Sample volunteer data
        List<Map<String, Object>> volunteers = Arrays.asList(
            createVolunteerMap(1, "John Smith", "medical", "available", 4.8),
            createVolunteerMap(2, "Sarah Johnson", "rescue", "busy", 4.9),
            createVolunteerMap(3, "Mike Brown", "fire", "available", 4.7),
            createVolunteerMap(4, "Emma Davis", "medical", "available", 4.6)
        );
        
        response.put("volunteers", volunteers);
        response.put("total", volunteers.size());
        response.put("available", volunteers.stream().mapToInt(v -> "available".equals(v.get("status")) ? 1 : 0).sum());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> updateVolunteerAvailability(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        // Extract volunteer data from request
        String volunteerId = (String) request.get("volunteerId");
        String status = (String) request.get("status");
        String location = (String) request.get("location");
        List<String> skills = (List<String>) request.get("skills");
        
        // Simulate updating volunteer availability
        Map<String, Object> updatedVolunteer = new HashMap<>();
        updatedVolunteer.put("volunteerId", volunteerId);
        updatedVolunteer.put("status", status);
        updatedVolunteer.put("location", location);
        updatedVolunteer.put("skills", skills);
        updatedVolunteer.put("lastUpdated", LocalDateTime.now());
        
        response.put("message", "Volunteer availability updated successfully");
        response.put("volunteer", updatedVolunteer);
        response.put("success", true);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assignments")
    public ResponseEntity<Map<String, Object>> getVolunteerAssignments(@RequestParam(required = false) String volunteerId) {
        Map<String, Object> response = new HashMap<>();
        
        // Sample assignments data
        List<Map<String, Object>> assignments = Arrays.asList(
            createAssignmentMap(1, "Emergency Case #001", "medical", "pending"),
            createAssignmentMap(2, "Emergency Case #003", "rescue", "in_progress"),
            createAssignmentMap(3, "Emergency Case #007", "fire", "completed")
        );
        
        response.put("assignments", assignments);
        response.put("total", assignments.size());
        response.put("volunteerId", volunteerId);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assignments/{assignmentId}/accept")
    public ResponseEntity<Map<String, Object>> acceptAssignment(@PathVariable String assignmentId, @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        String volunteerId = (String) request.get("volunteerId");
        
        response.put("message", "Assignment accepted successfully");
        response.put("assignmentId", assignmentId);
        response.put("volunteerId", volunteerId);
        response.put("status", "accepted");
        response.put("acceptedAt", LocalDateTime.now());
        response.put("success", true);
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createVolunteerMap(int id, String name, String specialization, String status, double rating) {
        Map<String, Object> volunteer = new HashMap<>();
        volunteer.put("id", id);
        volunteer.put("name", name);
        volunteer.put("email", name.toLowerCase().replace(" ", ".") + "@volunteers.com");
        volunteer.put("specialization", specialization);
        volunteer.put("status", status);
        volunteer.put("rating", rating);
        volunteer.put("completedCases", (int) (Math.random() * 50) + 10);
        volunteer.put("location", Arrays.asList("40.7128", "-74.0060")); // NYC coordinates as example
        volunteer.put("joinedDate", "2024-01-15");
        return volunteer;
    }

    private Map<String, Object> createAssignmentMap(int id, String caseTitle, String type, String status) {
        Map<String, Object> assignment = new HashMap<>();
        assignment.put("id", id);
        assignment.put("caseTitle", caseTitle);
        assignment.put("type", type);
        assignment.put("status", status);
        assignment.put("priority", (int) (Math.random() * 5) + 1);
        assignment.put("location", Arrays.asList("40.7589", "-73.9851")); // Different NYC coordinates
        assignment.put("assignedAt", LocalDateTime.now().minusHours((int) (Math.random() * 24)));
        assignment.put("estimatedDuration", (int) (Math.random() * 180) + 30 + " minutes");
        return assignment;
    }
}