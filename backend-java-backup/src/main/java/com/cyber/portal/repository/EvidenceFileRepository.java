package com.cyber.portal.repository;

import com.cyber.portal.entity.EvidenceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvidenceFileRepository extends JpaRepository<EvidenceFile, Long> {
}
