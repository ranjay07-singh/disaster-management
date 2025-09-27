package com.disaster.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        Map<String, Object> response = new HashMap<>();
        
        // Sample user data (will be replaced with real database queries)
        List<Map<String, Object>> users = Arrays.asList(
            createUserMap(1, "admin@disastermanagement.com", "System Administrator", "monitoring"),
            createUserMap(2, "volunteer1@example.com", "John Volunteer", "volunteer"),
            createUserMap(3, "volunteer2@example.com", "Sarah Helper", "volunteer"),
            createUserMap(4, "victim1@example.com", "Emergency User", "victim")
        );
        
        response.put("users", users);
        response.put("total", users.size());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        if (id <= 4) {
            String[] emails = {"", "admin@disastermanagement.com", "volunteer1@example.com", "volunteer2@example.com", "victim1@example.com"};
            String[] names = {"", "System Administrator", "John Volunteer", "Sarah Helper", "Emergency User"};
            String[] roles = {"", "monitoring", "volunteer", "volunteer", "victim"};
            
            Map<String, Object> user = createUserMap(id, emails[id.intValue()], names[id.intValue()], roles[id.intValue()]);
            response.put("user", user);
            response.put("found", true);
        } else {
            response.put("found", false);
            response.put("message", "User not found");
        }
        
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<Map<String, Object>> getUsersByRole(@PathVariable String role) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> users = new ArrayList<>();
        
        switch (role.toLowerCase()) {
            case "monitoring":
                users.add(createUserMap(1, "admin@disastermanagement.com", "System Administrator", "monitoring"));
                break;
            case "volunteer":
                users.add(createUserMap(2, "volunteer1@example.com", "John Volunteer", "volunteer"));
                users.add(createUserMap(3, "volunteer2@example.com", "Sarah Helper", "volunteer"));
                break;
            case "victim":
                users.add(createUserMap(4, "victim1@example.com", "Emergency User", "victim"));
                break;
        }
        
        response.put("users", users);
        response.put("role", role);
        response.put("total", users.size());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createUserMap(long id, String email, String name, String role) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", id);
        user.put("email", email);
        user.put("name", name);
        user.put("role", role);
        user.put("isActive", true);
        user.put("createdAt", LocalDateTime.now().minusDays(30));
        return user;
    }
}