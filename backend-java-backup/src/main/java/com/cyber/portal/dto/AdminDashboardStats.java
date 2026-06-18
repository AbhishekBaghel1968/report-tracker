package com.cyber.portal.dto;

import java.util.Map;

public class AdminDashboardStats {
    private long totalUsers;
    private long totalComplaints;
    private long pendingComplaints;
    private long resolvedComplaints;
    private Map<String, Long> statusBreakdown;
    private Map<String, Long> categoryBreakdown;

    // Constructors
    public AdminDashboardStats() {
    }

    public AdminDashboardStats(long totalUsers, long totalComplaints, long pendingComplaints, long resolvedComplaints,
                               Map<String, Long> statusBreakdown, Map<String, Long> categoryBreakdown) {
        this.totalUsers = totalUsers;
        this.totalComplaints = totalComplaints;
        this.pendingComplaints = pendingComplaints;
        this.resolvedComplaints = resolvedComplaints;
        this.statusBreakdown = statusBreakdown;
        this.categoryBreakdown = categoryBreakdown;
    }

    // Getters and Setters
    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public long getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(long pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public long getResolvedComplaints() {
        return resolvedComplaints;
    }

    public void setResolvedComplaints(long resolvedComplaints) {
        this.resolvedComplaints = resolvedComplaints;
    }

    public Map<String, Long> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(Map<String, Long> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }

    public Map<String, Long> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(Map<String, Long> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }
}
