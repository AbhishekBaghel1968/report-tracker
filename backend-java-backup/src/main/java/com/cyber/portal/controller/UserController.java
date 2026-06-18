package com.cyber.portal.controller;

import com.cyber.portal.dto.PasswordChangeRequest;
import com.cyber.portal.dto.ProfileUpdateRequest;
import com.cyber.portal.entity.Complaint;
import com.cyber.portal.entity.ComplaintStatus;
import com.cyber.portal.entity.User;
import com.cyber.portal.service.ComplaintService;
import com.cyber.portal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private ComplaintService complaintService;

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String email = authentication.getName();
        User user = userService.findByEmail(email);

        // Fetch citizen-specific complaint counts
        List<Complaint> complaints = complaintService.getCitizenComplaints(email);
        long totalComplaints = complaints.size();
        long resolved = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();
        long pending = complaints.stream().filter(c -> c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.REJECTED).count();

        Map<String, Object> profileResponse = new HashMap<>();
        profileResponse.put("id", user.getId());
        profileResponse.put("name", user.getName());
        profileResponse.put("email", user.getEmail());
        profileResponse.put("phone", user.getPhone());
        profileResponse.put("role", user.getRole().name());
        profileResponse.put("createdAt", user.getCreatedAt());
        profileResponse.put("totalComplaints", totalComplaints);
        profileResponse.put("resolvedComplaints", resolved);
        profileResponse.put("pendingComplaints", pending);

        return ResponseEntity.ok(profileResponse);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String email = authentication.getName();
        User updated = userService.updateProfile(email, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication authentication, @Valid @RequestBody PasswordChangeRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String email = authentication.getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
