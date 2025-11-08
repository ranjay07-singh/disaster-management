package com.disaster.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/emergency")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmergencyController {

    // In-memory storage for emergencies (will be lost on restart)
    private static final Map<Long, Map<String, Object>> emergencyStore = new HashMap<>();
    private static long nextId = 1;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllEmergencies() {
        Map<String, Object> response = new HashMap<>();
        
        // Return stored emergencies
        List<Map<String, Object>> emergencies = new ArrayList<>(emergencyStore.values());
        
        response.put("emergencies", emergencies);
        response.put("total", emergencies.size());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEmergencyById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> emergency = emergencyStore.get(id);
        if (emergency != null) {
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
        
        // Filter emergencies by status
        for (Map<String, Object> emergency : emergencyStore.values()) {
            String emergencyStatus = (String) emergency.get("status");
            if (emergencyStatus != null && emergencyStatus.equalsIgnoreCase(status)) {
                emergencies.add(emergency);
            }
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
        long newId = nextId++;
        
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
        newEmergency.put("updatedAt", LocalDateTime.now());
        newEmergency.put("victimId", emergencyData.get("victimId"));
        
        // Store the emergency in memory
        emergencyStore.put(newId, newEmergency);
        
        System.out.println("✅ Emergency stored: ID=" + newId + ", Total emergencies=" + emergencyStore.size());
        
        response.put("emergency", newEmergency);
        response.put("message", "Emergency created successfully");
        response.put("created", true);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEmergencyStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> updateData) {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> emergency = emergencyStore.get(id);
        if (emergency != null) {
            // Update status
            String newStatus = (String) updateData.get("status");
            if (newStatus != null) {
                emergency.put("status", newStatus);
                emergency.put("updatedAt", LocalDateTime.now());
                
                // If marked as completed/resolved, add resolution timestamp
                if ("completed".equalsIgnoreCase(newStatus) || "resolved".equalsIgnoreCase(newStatus)) {
                    emergency.put("resolvedAt", LocalDateTime.now());
                }
                
                emergencyStore.put(id, emergency);
                
                System.out.println("✅ Emergency " + id + " updated to status: " + newStatus);
                
                response.put("emergency", emergency);
                response.put("message", "Emergency status updated successfully");
                response.put("updated", true);
            } else {
                response.put("message", "Status field is required");
                response.put("updated", false);
            }
        } else {
            response.put("message", "Emergency not found");
            response.put("updated", false);
        }
        
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
