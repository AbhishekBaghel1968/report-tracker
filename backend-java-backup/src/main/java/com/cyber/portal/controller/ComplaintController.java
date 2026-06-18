package com.cyber.portal.controller;

import com.cyber.portal.dto.AdminDashboardStats;
import com.cyber.portal.dto.StatusUpdateRequest;
import com.cyber.portal.entity.Complaint;
import com.cyber.portal.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitComplaint(
            Authentication authentication,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("priority") String priority,
            @RequestParam("description") String description,
            @RequestParam("incidentDate") String incidentDate,
            @RequestParam(value = "evidence", required = false) MultipartFile file) {
        
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String email = authentication.getName();
        Complaint complaint = complaintService.createComplaint(
                email, title, category, priority, description, incidentDate, file);
        return ResponseEntity.ok(complaint);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCitizenComplaints(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String email = authentication.getName();
        return ResponseEntity.ok(complaintService.getCitizenComplaints(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Complaint> updateComplaintStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        Complaint updated = complaintService.updateComplaintStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteComplaint(@PathVariable Long id) {
        complaintService.deleteComplaint(id);
        return ResponseEntity.ok(Map.of("message", "Complaint deleted successfully"));
    }

    @GetMapping("/track/{complaintId}")
    public ResponseEntity<Complaint> trackComplaint(@PathVariable String complaintId) {
        return ResponseEntity.ok(complaintService.getComplaintByTrackingId(complaintId));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<AdminDashboardStats> getAdminStats() {
        return ResponseEntity.ok(complaintService.getAdminStats());
    }
}
