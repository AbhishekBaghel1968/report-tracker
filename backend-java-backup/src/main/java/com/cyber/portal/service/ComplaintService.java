package com.cyber.portal.service;

import com.cyber.portal.dto.AdminDashboardStats;
import com.cyber.portal.entity.*;
import com.cyber.portal.exception.ResourceNotFoundException;
import com.cyber.portal.repository.ComplaintRepository;
import com.cyber.portal.repository.EvidenceFileRepository;
import com.cyber.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EvidenceFileRepository evidenceFileRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Transactional
    public Complaint createComplaint(String userEmail, String title, String category,
                                     String priorityStr, String description, String incidentDateStr,
                                     MultipartFile file) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ComplaintPriority priority = ComplaintPriority.valueOf(priorityStr.toUpperCase());
        LocalDate incidentDate = LocalDate.parse(incidentDateStr);

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setTitle(title);
        complaint.setCategory(category);
        complaint.setPriority(priority);
        complaint.setDescription(description);
        complaint.setIncidentDate(incidentDate);
        complaint.setStatus(ComplaintStatus.SUBMITTED);
        
        // Generate Unique tracking ID: COMP-XXXXXXXX (8 random alphanumeric characters)
        String trackingId = "COMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        complaint.setComplaintId(trackingId);

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Upload evidence file if provided
        if (file != null && !file.isEmpty()) {
            String savedFileName = fileStorageService.storeFile(file);
            EvidenceFile evidenceFile = new EvidenceFile();
            evidenceFile.setComplaint(savedComplaint);
            evidenceFile.setFileName(file.getOriginalFilename());
            evidenceFile.setFilePath(savedFileName);
            evidenceFile.setUploadedAt(LocalDateTime.now());
            evidenceFileRepository.save(evidenceFile);
            savedComplaint.getEvidenceFiles().add(evidenceFile);
        }

        return savedComplaint;
    }

    public List<Complaint> getCitizenComplaints(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc();
    }

    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));
    }

    public Complaint getComplaintByTrackingId(String trackingId) {
        return complaintRepository.findByComplaintId(trackingId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with tracking ID: " + trackingId));
    }

    @Transactional
    public Complaint updateComplaintStatus(Long id, ComplaintStatus status) {
        Complaint complaint = getComplaintById(id);
        complaint.setStatus(status);
        return complaintRepository.save(complaint);
    }

    @Transactional
    public void deleteComplaint(Long id) {
        Complaint complaint = getComplaintById(id);
        complaintRepository.delete(complaint);
    }

    public AdminDashboardStats getAdminStats() {
        long totalUsers = userRepository.count();
        long totalComplaints = complaintRepository.count();

        // Pending complaints are everything NOT in RESOLVED or REJECTED status
        long pending = complaintRepository.findAll().stream()
                .filter(c -> c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.REJECTED)
                .count();

        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);

        // Status Breakdown
        Map<String, Long> statusBreakdown = new HashMap<>();
        for (ComplaintStatus status : ComplaintStatus.values()) {
            statusBreakdown.put(status.name(), complaintRepository.countByStatus(status));
        }

        // Category Breakdown
        Map<String, Long> categoryBreakdown = complaintRepository.findAll().stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        return new AdminDashboardStats(
                totalUsers,
                totalComplaints,
                pending,
                resolved,
                statusBreakdown,
                categoryBreakdown
        );
    }
}
