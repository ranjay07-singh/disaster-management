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

    /**
     * Update user profile (e.g., profile image URL, personal info, emergency contacts)
     * PATCH /api/users/{userId}
     * Body: { 
     *   "profileImage": "https://s3-url.com/image.jpg",
     *   "name": "John Doe",
     *   "phone": "1234567890",
     *   "location": { "latitude": 0.0, "longitude": 0.0, "address": "123 Main St" },
     *   "emergencyContacts": ["Contact 1 - 1234567890", "Contact 2 - 0987654321"]
     * }
     */
    @PatchMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateUserProfile(
            @PathVariable String userId,
            @RequestBody Map<String, Object> updates) {
        
        System.out.println("✅ PATCH /users/" + userId + " - Updating user profile");
        System.out.println("📝 Updates received: " + updates);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Log individual update fields
            if (updates.containsKey("profileImage")) {
                System.out.println("🖼️ Profile image URL: " + updates.get("profileImage"));
            }
            if (updates.containsKey("name")) {
                System.out.println("👤 Name: " + updates.get("name"));
            }
            if (updates.containsKey("phone")) {
                System.out.println("📱 Phone: " + updates.get("phone"));
            }
            if (updates.containsKey("location")) {
                System.out.println("📍 Location: " + updates.get("location"));
            }
            if (updates.containsKey("emergencyContacts")) {
                System.out.println("� Emergency Contacts: " + updates.get("emergencyContacts"));
            }
            
            // TODO: Update user in database
            // For now, just return success since we're using Firebase authentication
            // The profile data will be stored in Firebase
            
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("userId", userId);
            response.put("updatedFields", updates.keySet());
            response.put("timestamp", LocalDateTime.now());
            
            System.out.println("✅ Profile update successful for user: " + userId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error updating user profile: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
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
