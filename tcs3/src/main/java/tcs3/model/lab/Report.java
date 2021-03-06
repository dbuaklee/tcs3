package tcs3.model.lab;

import java.util.Date;
import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderColumn;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

@Entity
@Table(name="lab_report")
@SequenceGenerator(name="lab_report_SEQ", sequenceName="lab_report_SEQ", allocationSize=1)
@JsonIdentityInfo(generator=ObjectIdGenerators.PropertyGenerator.class, property="id",scope=Request.class)
public class Report {
	
	
	public static Logger logger = LoggerFactory.getLogger(Report.class);
	
	@Id
	@GeneratedValue(strategy=GenerationType.SEQUENCE ,generator="lab_report_SEQ")
	@Column(name="REPORT_ID")
	private Long id;
	
	@ManyToOne
	@JoinColumn(name="REQ_ID")
	private Request request;
	
	@Temporal(TemporalType.TIMESTAMP)
	@Column(name="REPORT_DATE")
	private Date reportDate;
	
	
	@Column(name="TYPE")
	private Integer type;
	
	@OneToMany
	@OrderColumn(name="HIS_INDEX")
	private List<ReportHistory> histories;
	
	@OneToOne(mappedBy="report")
	private ReportSentDetail sentDetail;


	public Long getId() {
		return id;
	}


	public void setId(Long id) {
		this.id = id;
	}


	public Request getRequest() {
		return request;
	}


	public void setRequest(Request request) {
		this.request = request;
	}


	public Date getReportDate() {
		return reportDate;
	}


	public void setReportDate(Date reportDate) {
		this.reportDate = reportDate;
	}


	public List<ReportHistory> getHistories() {
		return histories;
	}


	public void setHistories(List<ReportHistory> histories) {
		this.histories = histories;
	}
	
}
