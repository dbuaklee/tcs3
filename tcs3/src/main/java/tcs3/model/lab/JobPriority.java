package tcs3.model.lab;

public enum JobPriority {
	NORMAL(1), EXPRESS(2);
	
	private final Integer code;
	
	private JobPriority(Integer code) {
		// TODO Auto-generated constructor stub
		this.code = code;
	}
}