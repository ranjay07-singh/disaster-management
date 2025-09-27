package com.disaster.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/emergency")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmergencyController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllEmergencies() {
        Map<String, Object> response = new HashMap<>();
        
        // Sample emergency data
        List<Map<String, Object>> emergencies = Arrays.asList(
            createEmergencyMap(1, "medical", "Person injured in car accident", 4, "pending"),
            createEmergencyMap(2, "fire", "Small kitchen fire reported", 3, "resolved"),
            createEmergencyMap(3, "rescue", "Person trapped in elevator", 2, "in_progress")
        );
        
        response.put("emergencies", emergencies);
        response.put("total", emergencies.size());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEmergencyById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        if (id <= 3) {
            String[] types = {"", "medical", "fire", "rescue"};
            String[] descriptions = {"", "Person injured in car accident", "Small kitchen fire reported", "Person trapped in elevator"};
            int[] severities = {0, 4, 3, 2};
            String[] statuses = {"", "pending", "resolved", "in_progress"};
            
            Map<String, Object> emergency = createEmergencyMap(id, types[id.intValue()], descriptions[id.intValue()], severities[id.intValue()], statuses[id.intValue()]);
            response.put("emergency", emergency);
            response.put("found", true);
        } else {
            response.put("found", false);
            response.put("message", "Emergency not found");
        }
        
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getEmergenciesByStatus(@PathVariable String status) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> emergencies = new ArrayList<>();
        
        switch (status.toLowerCase()) {
            case "pending":
                emergencies.add(createEmergencyMap(1, "medical", "Person injured in car accident", 4, "pending"));
                break;
            case "resolved":
                emergencies.add(createEmergencyMap(2, "fire", "Small kitchen fire reported", 3, "resolved"));
                break;
            case "in_progress": 
                emergencies.add(createEmergencyMap(3, "rescue", "Person trapped in elevator", 2, "in_progress"));
                break;
        }
        
        response.put("emergencies", emergencies);
        response.put("status", status);
        response.put("total", emergencies.size());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEmergency(@RequestBody Map<String, Object> emergencyData) {
        Map<String, Object> response = new HashMap<>();
        
        // Generate new ID
        long newId = 4;
        
        Map<String, Object> newEmergency = new HashMap<>();
        newEmergency.put("id", newId);
        newEmergency.put("caseType", emergencyData.get("caseType"));
        newEmergency.put("description", emergencyData.get("description"));
        newEmergency.put("severityLevel", emergencyData.get("severityLevel"));
        newEmergency.put("locationLat", emergencyData.get("locationLat"));
        newEmergency.put("locationLng", emergencyData.get("locationLng"));
        newEmergency.put("locationAddress", emergencyData.get("locationAddress"));
        newEmergency.put("status", "pending");
        newEmergency.put("createdAt", LocalDateTime.now());
        newEmergency.put("victimId", emergencyData.get("victimId"));
        
        response.put("emergency", newEmergency);
        response.put("message", "Emergency created successfully");
        response.put("created", true);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createEmergencyMap(long id, String type, String description, int severity, String status) {
        Map<String, Object> emergency = new HashMap<>();
        emergency.put("id", id);
        emergency.put("caseType", type);
        emergency.put("description", description);
        emergency.put("severityLevel", severity);
        emergency.put("status", status);
        emergency.put("locationLat", 40.7128 + (Math.random() - 0.5) * 0.1);
        emergency.put("locationLng", -74.0060 + (Math.random() - 0.5) * 0.1);
        emergency.put("locationAddress", "New York, NY");
        emergency.put("createdAt", LocalDateTime.now().minusHours(id));
        emergency.put("victimId", 4);
        return emergency;
    }
}