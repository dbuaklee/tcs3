package tcs3.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QueryDslPredicateExecutor;

import tcs3.model.lab.Invoice;
import tcs3.model.lab.LabJob;
import tcs3.model.lab.LabNoSequence;
import tcs3.model.lab.Request;
import tcs3.model.lab.RequestSample;

public interface LabNoSequenceRepository extends JpaRepository<LabNoSequence, Long>, QueryDslPredicateExecutor<LabNoSequence> {

}
