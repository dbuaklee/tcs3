/**
 * 
 */
var AppRouter = Backbone.Router.extend({
	initialize : function(options) {
		this.defaultBreadCrumb = Handlebars.compile($("#defaultBreadCrumbTemplate").html());
		this.newBreadCrumb = Handlebars.compile($("#newBreadCrumbTemplate").html());
		
		this.$breadcrubmEl = $("#breadcrumb");
		
		
		// now we're ready for initialize the view
		this.searchView = new SearchView({el: '#searchView'});
		this.tableResultView = new TableResultView({el: '#tableResultView'});
		this.formView = new FormView({el: '#formView'});
		
		
	},
    routes: {
        "newRequestFromQuotation/:id" : "newRequestFromQuotation",
        "newRequest" : "newRequest",
        "Request/:id" : "showRequest",
        "*actions": "defaultRoute" // Backbone will try match the route above first
    },
    
    defaultRoute: function(action) {
    	this.tableResultView.$el.empty();
    	this.formView.$el.empty();
    	this.$breadcrubmEl.html(this.defaultBreadCrumb());
    	
    	
    	this.searchView.render();
    	
    },
    showRequest: function(requestId) {
    	this.searchView.$el.empty();
    	this.tableResultView.$el.empty();
    	this.$breadcrubmEl.html(this.newBreadCrumb());
    	
    	this.formView.editRequest(requestId);
    },
    newRequestFromQuotation: function(quotationId) {
    	this.searchView.$el.empty();
    	this.tableResultView.$el.empty();
    	this.$breadcrubmEl.html(this.newBreadCrumb());
    	
    	this.formView.newRequest(quotationId);
    	
    },
    
    newRequest: function() {
    	this.searchView.$el.empty();
    	this.tableResultView.$el.empty();
    	this.$breadcrubmEl.html(this.newBreadCrumb());
    	
    	this.formView.newRequest();
    	
    }
    
});



var SearchView = Backbone.View.extend({
	

    initialize: function(options){
    	this.searchViewTemplate = Handlebars.compile($("#searchViewTemplate").html());
    	this.orgSelectionTemplate = Handlebars.compile($("#orgSelectionTemplate").html());
    	
    	
    	// Global variable better be there
    	this.mainOrgCollection = mainOrgs;
    	this.currentMainOrg = userMainOrg;
    	this.groupOrgCollection = groupOrgs.clone();
    	
    	this.searchModel = new App.Models.Request();
    	this.searchModel.set("mainOrg", null);
    	
    	this.currentGroupOrg=null;
    	this.nameQuery=null;
    	this.codeQuery=null;
    },
    
 // Template
	//orgSelectionTemplate : Handlebars.compile($("#orgSelectionTemplate").html()),
	//searchViewTemplate : Handlebars.compile($("#searchViewTemplate").html()),
 
    
    events: {
    	"click #newRequestBtn" : "newRequest",
    	"click #newRequestFromQuotationBtn" : "newRequestFromQuotation",
    	"change .txtInput" : "onChangeTxtInput",
    	"change .formSlt" : "onChangeFormSlt",
    	"click #searchRequestBtn" : "onClickSearchRequestBtn"
    	
    },
    onChangeFormSlt: function(e) {
    	var id=$(e.currentTarget).val();
    	var field=$(e.currentTarget).attr('data-field'); 

    	var model;
    	
    	if(field == "sampleType") {
    		model = App.Models.SampleType.findOrCreate({id:id});
    	} else if(field=="mainOrg") {
    		if(id == 0) {
        		this.currentGroupOrg = null;
        		model = null;
        		this.groupOrgCollection.reset();
        		this.renderOrgSlt();
        		
        	} else {
        		this.currentMainOrg = App.Models.Organization.findOrCreate({id: id});
        		model=this.currentMainOrg;
        		this.groupOrgCollection.url = appUrl('Organization') + '/' + this.currentMainOrg.get('id') + '/children';
            	this.groupOrgCollection.fetch({
        			success: _.bind(function() {
        				this.renderOrgSlt();
        			},this)
        		});		
        	}
    		
    		
    		
    	} else if(field=="groupOrg") {
    		if(id == 0) {
        		this.currentGroupOrg = null;
        		model = null;
        	} else {
        		this.currentGroupOrg = App.Models.Organization.findOrCreate({id: id});
        		model = this.currentGroupOrg;
        	}
    	} else {
    		return false;
    	}
    	
    	
    	this.searchModel.set(field, model);
    },
    onChangeTxtInput: function(e) {
    	var value = $(e.currentTarget).val();
    	var field = $(e.currentTarget).attr("data-field");
    	
    	this.searchModel.set(field, value);
    },
    

    onClickSearchRequestBtn: function(e) {
    	e.preventDefault();
    	appRouter.tableResultView.search(this.searchModel, 1);
    	return false;
    },
  
    newRequest : function() {
    	console.log("new request");
    	appRouter.navigate("newRequest", {trigger: true})
    },
    
    renderOrgSlt: function() {
    	var json = {};
    	json.mainGroup = this.groupOrgCollection.toJSON();
    	this.$el.find('#orgSlt').html(this.orgSelectionTemplate(json));
    	return this;
    },
    
    render: function() {
    	var json = {};
    	
    	json.sampleTypes=new Array();
		json.sampleTypes.push({id:0,nameTh: 'กรุณาเลือกประเภทตัวอย่าง'});
		$.merge(json.sampleTypes, sampleTypes.toJSON());
    	
    	
    	json.mainOrg = new Array();
    	json.mainOrg.push({id:0,abbr: 'กรุณาเลือกหน่วยงาน'});
    	 
 		$.merge(json.mainOrg, this.mainOrgCollection.toJSON());
    	for(var i=0; i< json.mainOrg.length; i++){
    		if(this.currentMainOrg!= null && json.mainOrg[i].id == this.currentMainOrg.get('id')) {
    			json.mainOrg[i].selected = true;
    		}
    	}
    	this.$el.html(this.searchViewTemplate(json));
    	this.renderOrgSlt();
    	return this;
    	
    }
});


var TableResultView = Backbone.View.extend({
	initialize: function(options){
		this.tableResultViewTemplate = Handlebars.compile($('#tableResultViewTemplate').html());
		
		this.requests = new App.Pages.Requests();
		this.searchModel = new App.Models.Request();
		
		this.currentMainOrg=null;
		this.currentGroupOrg=null;
    	this.nameQuery=null;
    	this.codeQuery=null;
    	this.currentPage=null;
	},
	events: {
		"click .templatesPageNav" : "onClickPageNav",		         
		"change #templatesPageTxt" : "onChangeTemplatesPageTxt",
		"click .templateLnk" : "onClickTemplateLnk"
	},
	onClickTemplateLnk: function(e) {
		e.preventDefault();
		var templateId = $(e.currentTarget).parents('tr').attr('data-id');
		
		appRouter.navigate('newQuotationFromTemplate/' +templateId, {trigger: true});
		return false;
		
	},
	onClickPageNav: function(e) {
		var targetPage=$(e.currentTarget).attr('data-targetPage');
		this.searchAndRenderPage(targetPage);
	},
	onChangeTemplatesPageTxt: function(e) {
		 var oldValue=e.target.getAttribute('value')
		
		var targetPage=$(e.currentTarget).val();
		//now check
		targetPage=parseInt(targetPage);
		if(targetPage > this.requests.page.totalPages) {
			alert('หน้าของข้อมูลที่ระบุมีมากกว่าจำนวนหน้าทั้งหมด กรุณาระบุใหม่');
			$(e.currentTarget).val(oldValue);
			return;
		}
		this.searchAndRenderPage(targetPage);
	},
    render: function() {
    	var json = {};
    	json.page = this.requests.page;
		json.content = this.requests.toJSON();
    	this.$el.html(this.tableResultViewTemplate(json));
    	
    	return this;
    },
    searchAndRenderPage: function(pageNumber) {
    	this.$el.html(__loaderHtml());
    	this.requests.fetch({
    		data: JSON.stringify(this.searchModel.toJSON()),
    		type: 'POST',
    		dataType: 'json',
    		contentType: 'application/json',
    		url: appUrl("Request/findByField/page/"+pageNumber),
    		success: _.bind(function(collection, response, options) {
    			this.render();
    		},this)
    	})
    },
	
    search: function(searchModel, pageNumber) {
    	this.currentPage = pageNumber;
    	
    	this.searchModel = searchModel;
    	
    	this.searchAndRenderPage(pageNumber);

    },
});

var CompanyModal = Backbone.View.extend({
	 initialize: function(options){
		 this.companyModalBodyTemplate = Handlebars.compile($('#companyModalBodyTemplate').html());
		 this.companySearchTblTemplate = Handlebars.compile($('#companySearchTblTemplate').html());
		 this.companies = new App.Pages.Companies();
		 this.parentView=null;
	 },
	 events: {
		 "click #companyModalCloseBtn" : "onClickCloseBtn",
		 "click #companyModalSaveBtn" : "onClickSaveBtn",
		 "searched.fu.search #companySrh" : "onSearchCompany",
		 "click .testMethodPageNav" : "onClickPageNav",
		 "change #testMethodPageTxt" : "onChangeTestMethodPageTxt"
	 },
	 onClickSaveBtn: function(e) {
		 var companyId = this.$el.find('.companyRdo:checked').val();
		 
		 var company = App.Models.Company.find({id: companyId});
		 
		 this.parentView.currentRequest.set('company', company);
		 if(company.get('addresses').length == 0) {
			 this.parentView.currentRequest.set('address', company.get('oldAddress'));
		 } else {
			 this.parentView.currentRequest.set('address', company.get('addresses').at(0));
		 }
		 
		 this.parentView.currentRequest.set('contact', company.get('people').at(0));
		 
		 this.parentView.renderCompany();
		 
		 this.$el.modal('hide');
	 },
	 onClickCloseBtn: function() {
		 this.$el.modal('hide');
		 return false;
	 },
	 onChangeTestMethodPageTxt: function(e) {
			var targetPage=$(e.currentTarget).val();
			//now check
			targetPage=parseInt(targetPage);
			if(targetPage > this.companies.page.totalPages) {
				alert('หน้าของข้อมูลที่ระบุมีมากกว่าจำนวนหน้าทั้งหมด กรุณาระบุใหม่');
				return;
			}
			this.search(targetPage);
		 },
		 onClickPageNav: function(e) {
			var targetPage=$(e.currentTarget).attr('data-targetPage');
			this.search(targetPage);
			
		 },
	 search: function(pageNumber) {
		 var query = this.$el.find('#queryTxt').val();
		 this.companies.fetch({
	    		data: {
	    			nameQuery : query,
	    		},
	    		type: 'POST',
	    		url: appUrl("Company/findByName/page/"+pageNumber),
	    		success: _.bind(function(collection, response, options) {
	    			this.$el.find('.loader').loader('destroy');
					var json={};
					json.page = this.companies.page;
					json.content = this.companies.toJSON();
					
					this.$el.find('#companySearchTbl').html(this.companySearchTblTemplate(json));
	    		},this)
	    	})
	 },
	 onSearchCompany: function(e) {
		 // put spinning
		this.$el.find('#companySearchTbl').html('<div class="loader"></div>');
		this.$el.find('.loader').loader();
		this.search(1);
		
	 },
	 setParentView: function(parent) {
		 this.parentView = parent;
	 },
	 render: function() {
		 this.$el.find('.modal-header span').html("ค้นหาชื่อบริษัท");
		 this.$el.find('.modal-body').html(this.companyModalBodyTemplate());
		 this.$el.find('#companySrh').search();
		 
		 this.$el.modal({show: true, backdrop: 'static', keyboard: false});
		 
		 return this;
	 }
	 
});

var TestMethodItemModal = Backbone.View.extend({
	 initialize: function(options){
		 this.testMethodGroupModalBodyTemplate = Handlebars.compile($('#testMethodGroupModalBodyTemplate').html());
		 this.testMethodItemModalBodyTemplate = Handlebars.compile($('#testMethodItemModalBodyTemplate').html());
		 this.testMethodSearchTblTemplate = Handlebars.compile($('#testMethodSearchTblTemplate').html());
		 this.mode="";
		 this.currentItem = null;
		 this.parentView = null;
		 this.testMethods = new App.Pages.TestMethods();
		 this.selected = new App.Collections.TestMethods();
	 },
	 setParentView : function(view) {
		this.parentView=view; 
	 },
	 events: {
		 "click #testMethodModalCloseBtn" : "onClickCloseBtn",
		 "click #testMethodModalSaveBtn" : "onClickSaveBtn",
		 "searched.fu.search #testMethodSrh" : "onSearchTestMethod",
		 "click .testMethodPageNav" : "onClickPageNav",
		 "change #testMethodPageTxt" : "onChangeTestMethodPageTxt",
		 
		 "click .testMethodRdo" : "onClickTestMethodRdo"
	 },
	 
	 onChangeTestMethodPageTxt: function(e) {
		var targetPage=$(e.currentTarget).val();
		//now check
		targetPage=parseInt(targetPage);
		if(targetPage > this.testMethods.page.totalPages) {
			alert('หน้าของข้อมูลที่ระบุมีมากกว่าจำนวนหน้าทั้งหมด กรุณาระบุใหม่');
			return;
		}
		this.search(targetPage);
	 },
	 onClickPageNav: function(e) {
		var targetPage=$(e.currentTarget).attr('data-targetPage');
		this.search(targetPage);
		
	 },
	 search: function(pageNumber) {
		 var query = this.$el.find('#queryTxt').val();
		 this.testMethods.fetch({
				url: appUrl('TestMethod/findByNameOrCode/page/'+pageNumber),
				type: 'POST',
				data: {
					query: query
				},
				success: _.bind(function(collection, response, options)  {
					this.$el.find('.loader').loader('destroy');
					var json={};
					json.page = this.testMethods.page;
					json.content = this.testMethods.toJSON();
					if(this.mode=="newTestMethodItem") {
						json.editMode = false;
						this.$el.find('#testMethodSearchTbl').html(this.testMethodSearchTblTemplate(json));
					} else {
						json.editMode = true;
						this.$el.find('#testMethodSearchTbl').html(this.testMethodSearchTblTemplate(json));
					}
				},this)
			})
	 },
	 
	 onSearchTestMethod: function(e) {
		 // put spinning
		this.$el.find('#testMethodSearchTbl').html('<div class="loader"></div>');
		this.$el.find('.loader').loader();
		this.search(1);
		
		
	 },
	 onClickTestMethodRdo: function(e) {
		 var testMethodId=$(e.currentTarget).val();
		 var testMethod = App.Models.TestMethod.find({id: testMethodId});
		 if($(e.currentTarget).is(':checked')) {
			 this.selected.push(testMethod);
		 } else {
			 this.selected.remove(testMethod);
		 }
	 },
	 onClickSaveBtn: function(e) {
		 if(this.mode == "editTestMethodItem") {
			 var testMethodId = this.$el.find('.testMethodRdo:checked').val();
			 
			 var testMethod = App.Models.TestMethod.find({id: testMethodId});
			 
			 if(testMethod == null) {
				 alert('กรุณาเลือกรายการทดสอบ');
				 return;
			 }
			 
			 var findItem =  this.currentRequest.get('testMethodItems')
			 		.find(function(item){
			 			if(item.get('testMethod') != null) { 
			 				return item.get('testMethod').get('id') == testMethod.get('id');
			 			}
			 			return false;
			 		});
			 
			 if(findItem != null) {
				 alert('รายการทดสอบนี้มีอยู่ในต้นแบบแล้ว กรุณาเลือกรายการใหม่');
				 return;
			 }
			 
			 // now copy value to current
			 this.currentItem.set('testMethod', testMethod);
			 this.currentItem.set('fee', testMethod.get('fee'));
			 
			 if(this.currentItem.get('quantity') == null) {
			 	this.currentItem.set('quantity', 1);
			 }
		 } else if(this.mode == "newTestMethodItem") {
			 this.selected.forEach(function(testMethod, index, list) {
				 var item = new App.Models.TestMethodQuotationItem();
				 
				 item.set('testMethod', testMethod);
				 item.set('fee', testMethod.get('fee'));
				 if(item.get('quantity') == null) {
					 	item.set('quantity', 1);
				 }
				 
				 var findItem =  this.currentRequest.get('testMethodItems')
				 		.find(function(item){
				 			if(item.get('testMethod') != null) { 
				 				return item.get('testMethod').get('id') == testMethod.get('id');
				 			}
				 			return false;
				 		});
				 if(findItem == null) {
				 	this.currentRequest.get('testMethodItems').add(item);
				 }
			 }, this);
			 
			 
			 
		 } else if(this.mode == "newTestMethodGroup" || this.mode == "editTestMethodGroup"){
			 var name = this.$el.find('#testMethodItemName').val();
			 if(name == null || name.length == 0) {
				 alert('กรุณาระบุชื่อกลุ่มรายการ');
				 return;
			 }
			 this.currentItem.set('name', name);
			 
			// do save
			 this.currentRequest.get('testMethodItems').add(this.currentItem);
		 }
		 
		 
		 this.parentView.renderQuotationItemTbl();
		 this.$el.modal('hide');
	 },
	 setRequest: function(request) {
		this.currentRequest =  request;
	 },
	 setCurrentItem : function(item) {
		this.currentItem = item; 
	 },
	 onClickCloseBtn: function() {
		 this.$el.modal('hide');
		 return false;
	 },
	 setMode: function(mode) {
		this.mode = mode; 
	 },
	 render: function() {
		 var json = {};
		 this.selected.reset();
		 if(this.mode == "newTestMethodItem") {
			 this.currentItem = 
				 new App.Models.TestMethodQuotationItem();
			 this.$el.find('.modal-header span').html("เพิ่มรายการทดสอบ");
			 this.$el.find('.modal-body').html(this.testMethodItemModalBodyTemplate());
			 this.$el.find('#testMethodSrh').search();
			 
		 } else if(this.mode == "newTestMethodGroup"){
			 this.currentItem = 
				 new App.Models.TestMethodQuotationItem();
			 this.$el.find('.modal-header span').html("เพิ่มกลุ่มรายการทดสอบ");
			 this.$el.find('.modal-body').html(this.testMethodGroupModalBodyTemplate());	
			 
		 }  else if(this.mode == "editTestMethodGroup"){
			 this.$el.find('.modal-header span').html("แก้ไขกลุ่มรายการทดสอบ");
			 json = this.currentItem.toJSON();
			 this.$el.find('.modal-body').html(this.testMethodGroupModalBodyTemplate(json));
		 } else if(this.mode = "editTestMethodItem") {
			 this.$el.find('.modal-header span').html("แก้ไขรายการทดสอบ");
			 json = this.currentItem.toJSON();
			 this.$el.find('.modal-body').html(this.testMethodItemModalBodyTemplate(json));
			 this.$el.find('#testMethodSrh').search();
		 }	
		 
		 this.$el.modal({show: true, backdrop: 'static', keyboard: false});
		 
		 return this;
	 }
});

var FormView =  Backbone.View.extend({
	/**
	 * @memberOf FormView
	 */
	initialize: function(options){
		this.requestViewTemplate = Handlebars.compile($("#requestViewTemplate").html());
		this.orgSelectionTemplate = Handlebars.compile($("#orgSelectionTemplate").html());
		this.quotationItemTblTemplate= Handlebars.compile($("#quotationItemTblTemplate").html());
		this.companyInfoTemplate =Handlebars.compile($("#companyInfoTemplate").html());
		this.currentRequest = null;
		
		this.testMethodItemModal = new TestMethodItemModal({el : '#testMethodModal'});
		this.testMethodItemModal.setParentView(this);
		
		this.companyModal = new CompanyModal({el: '#companyModal'});
		this.companyModal.setParentView(this);
	},
	
	events: {
		"click #backBtn" : "back",
		"change .txtInput" : "onTxtChange",
		"change #groupOrgSlt" : "onMainGroupChange",
		"click #saveQutationBtn" : "onSaveBtn",
		
		"click .itemLnk" : "onClickItem",
		"changed.fu.spinbox .itemQuantitySbx" : "onChangeItemQuantitySbx",
		"click .removeItemBtn" : "onClickRemoveItem",
		
		"click #newTestMethodGroupBtn" : "onClickNewTestMethodGroupBtn",
		"click #newTestMethodItemBtn" : "onClickNewTestMethodItemBtn",
		"click #companyBtn" : "onClickCompanyBtn",
		"click .promotionCbx" : "onClickPromotionCbx"
	},
	onClickCompanyBtn: function() {
		this.companyModal.render();
	},
	
	onClickPromotionCbx: function(e) {
		var promotionId=$(e.currentTarget).attr('data-id');
		var promotion = App.Models.Promotion.findOrCreate({id: promotionId});
		var promotionCheck = $(e.currentTarget).is(':checked');
		if(promotionCheck) {
			var pd = new App.Models.PromotionDiscount();
			pd.set("quotation", this.currentRequest);
			pd.set("promotion", promotion);
			this.currentRequest.get('promotions').add(pd);
			
		} else{
			var promotions = this.currentRequest.get('promotions');
			var pdFound = promotions.find(function(pd) {return pd.get('promotion').get('id') == promotionId});
			
			promotions.remove(pdFound);
		}
		
		this.calculateTotal();
		
	},
	calculateTotal: function() {
		var sumTotal = 0;
		var sumDiscount = 0;
		this.currentRequest.get('samples').each(function(itemLoop) {
			if(itemLoop.get('quantity') != null && itemLoop.get('quantity') > 0) {
				sumTotal += itemLoop.get('quantity') * itemLoop.get('testMethod').get('fee');
			}
		});
		
		this.currentRequest.set('currentTotalItems', sumTotal);
		this.$el.find('#sumTotalItem').html("<b>" + __addCommas(sumTotal) + "</b>");	
		
		if(this.currentRequest.get('sampleNum') != null) {
			sumTotal = sumTotal * this.currentRequest.get('sampleNum');
		}
		
		// reset all discount display first 
		this.$el.find('.promotionDiscountTxt').html(__addCommas(0));
		
		if(this.currentRequest.get('promotions') != null && this.currentRequest.get('promotions').length > 0) {
			var promotions = this.currentRequest.get('promotions');
			for(var i=0; i<promotions.length; i++) {
				var pd = promotions.at(i);
				var discount = (sumTotal * pd.get('promotion').get('percentDiscount') ) / 100;
				
				sumDiscount += discount;
				pd.set('discount', discount);
				
				// only turn on the one we actually have
				this.$el.find('#promotion_' + pd.get('promotion').get('id') ).html("<b>" + __addCommas(discount) + "</b>");
			}
		} 
		
		
		// now all the fee
		sumTotal = sumTotal + (this.currentRequest.get('copyFee'));
		sumTotal = sumTotal + (this.currentRequest.get('translateFee'));
		sumTotal = sumTotal + (this.currentRequest.get('coaFee'));
		sumTotal = sumTotal + (this.currentRequest.get('etcFee'));
		
		sumTotal = sumTotal - sumDiscount;
		
		this.$el.find('#sumTotal').html("<b>" + __addCommas(sumTotal) + "</b>");
		
	},
	onChangeItemQuantitySbx: function(e,v) {
		// see where is click
		var index=$(e.currentTarget).parents('tr').attr('data-index');
		
		if(!isNaN(index)) {
			var item = this.currentRequest.get('testMethodItems').at(index);
			item.set('quantity', v);
	
			$(e.currentTarget).parent().next().html(__addCommas(item.get('quantity') * item.get('testMethod').get('fee')));
		} else {
			var field=$(e.currentTarget).find('input').attr('data-field');
			if(field=='sampleNum'){
				var subTotal = this.currentRequest.get('currentTotalItems') * v;
				this.currentRequest.set('sampleNum', v);
				$(e.currentTarget).parent().next().html(__addCommas(subTotal));
			} else if(field=='etcFee'){
				this.currentRequest.set('etcFee', parseInt(v));
			} else {
				this.currentRequest.set(field, v);
				var forField = $(e.currentTarget).attr('data-calculateForField');
				this.currentRequest.set(forField, v*100);
				$(e.currentTarget).parent().next().html(__addCommas(v*100));
			}
		}
		
		this.calculateTotal();
			
	},
	onClickRemoveItem: function(e) {
		
		var index=$(e.currentTarget).parents('tr').attr('data-index');
		var item = this.currentRequest.get('testMethodItems').at(index);
		var str= '';
		
		if(item.get('testMethod') != null) {
			str= 'คุณต้องการลบรายการทดสอบ ' + item.get('testMethod').get('code') + ' ?';
		} else {
			str= 'คุณต้องการลบรายการ ' + item.get('name');
		}
		var r = confirm(str);
		if (r == true) {
			this.currentRequest.get('testMethodItems').remove(item);
			this.renderQuotationItemTbl();
		} else {
		    return false;
		} 
		
		return false;
		
	},
	onClickNewTestMethodItemBtn: function(e) {
		this.testMethodItemModal.setMode('newTestMethodItem');
		this.testMethodItemModal.render();
    },
    onClickNewTestMethodGroupBtn: function(e) {
    	this.testMethodItemModal.setMode('newTestMethodGroup');
		this.testMethodItemModal.render();
    },
    onClickItem: function(e) {
    	e.preventDefault();
    	var index = $(e.currentTarget).attr('data-index');
    	var item = this.currentRequest.get('testMethodItems').at(index);
    	this.testMethodItemModal.setCurrentItem(item);
    	if(item.get('testMethod') == null) {
    		this.testMethodItemModal.setMode('editTestMethodGroup');	
    	} else {
    		this.testMethodItemModal.setMode('editTestMethodItem');
    	}
    	this.testMethodItemModal.render();
    	
    	return false;
    	
    },
	    
	
	onTxtChange: function(e) {
		var field = $(e.currentTarget).attr('data-field');
		var value = $(e.currentTarget).val();
		
		if(field == 'estimatedDay') {
			if(isNaN(value)) {
				alert('กรุณาระบุจำนวนวันเป็นตัวเลข');
				$(e.currentTarget).val("");
			} else {
				value = parseInt(value);
			}
		}
		
		this.currentRequest.set(field, value);
	},
	
	onMainGroupChange: function(e) {
		var mainGroupId = $(e.currentTarget).val();
		if(mainGroupId == 0) {
			this.currentRequest.set("groupOrg", null);
		} else {
			var groupOrg = App.Models.Organization.findOrCreate({id: mainGroupId});
			this.currentRequest.set("groupOrg", groupOrg);
		}
	},
	
	onSaveBtn : function(e) {
		if(this.currentRequest.get('name') == null) {
			alert('กรุณาระบุชื่อผลิตภํณฑ์');
			return;
		}
		
		if(this.currentRequest.get('code') == null) {
			alert('กรุณาระบุรหัสต้นแบบใบเสนอราคา');
			return;
		}
		
		if(this.currentRequest.get('groupOrg') == null) {
			alert('กรุณาระบุหน่วยงานรับผิดชอบ');
			return;
		}
		
		if(this.currentRequest.get('testMethodItems').length == 0) {
			alert('กรุณาระบุรายการทดสอบ');
			return;
		}
		
		this.currentRequest.save(null, {
			success:_.bind(function(model, response, options) {

				if(response.status != 'SUCCESS') {
					alert(response.status + " :" + response.message);
					return;
				}
				window.scrollTo(0, 0);
				this.currentRequest.set('id', response.data.id);
				this.currentRequest.set('quotationNo', response.data.quotationNo);

				alert("บันทึกข้อมูลแล้ว");
				this.render();
				
				appRouter.navigate("Quotation/" + this.currentRequest.get('id'), {trigger: false,replace: true});
		},this)});
	},
	
	back : function() {
		appRouter.navigate("", {trigger: true});
	},
	newRequest : function(quotationId) {
		var request = new App.Models.Request();
		
		// fill info from QuotationTemplate here
		var quotation ;
		if(quotationId != null) {
			quotation =  App.Models.Quotation.findOrCreate({id: quotationId});	
			quotation.fetch({
				success: _.bind(function() {
					request.set('quotation', quotation);
					
					
					this.render();
				}, this)
			});
		} else {
			
			this.currentRequest= request;
			this.testMethodItemModal.setRequest(this.currentRequest);
			this.render();
		}
	
	},
	editQuotation: function(id) {
		this.currentRequest = App.Models.Quotation.findOrCreate({id: id});
		this.currentRequest.fetch({
			success: _.bind(function() {
				this.testMethodItemModal.setQuotation(this.currentRequest);
				this.render();
			},this)
		})
		
		
	},
	fixHelperModified : function(e, tr) {
		var $originals = tr.children();
		var $helper = tr.clone(); 
		$helper.children().each(function(index)  {
			$(this).width($originals.eq(index).width()+10);     
		});
		return $helper;     
	}, 
	reorderQutationItem : function() {
		var count = 1;
		var oldItems = this.currentRequest.get('testMethodItems');
		var newItems = new App.Collections.TestMethodQuotationItems();
		 $("#quotationItemTbl tbody tr").each(function(index, tr) {
			 
			 
			 var itemIndex = $(tr).attr('data-index');
			 var item = oldItems.at(itemIndex);
			 
			 if(item.get('testMethod') != null) {
				 $(tr).find('.index').html(count);
				 count++;
			 }
			 $(tr).attr('data-index', index);
			 newItems.push(item);
		 });
		 
		 
		 
		 this.currentRequest.set('testMethodItems', newItems);
	},
	renderQuotationItemTbl: function() {
		
		var json = this.currentRequest.toJSON();

		if(json.testMethodItems != null) {
			var index=1;
	    	var total=0;
	    	for(var i=0; i< json.testMethodItems.length; i++) {
	    		if(json.testMethodItems[i].testMethod != null) {
	    			json.testMethodItems[i].index = index++;
	    			total += (json.testMethodItems[i].quantity)*(json.testMethodItems[i].fee);
	    			json.testMethodItems[i].totalLine = (json.testMethodItems[i].quantity)*(json.testMethodItems[i].fee);
	    		}
	    	}
	    	json.totalItems = total;
	    	
	    	json.totalItemSampleNum = json.totalItems * json.sampleNum;
	    	
	    	
	    	if(promotions.length > 0) {
	    		json.hasPromotions = true;
	    		json.allpromotions = promotions.toJSON();
	    		
	    		if(this.currentRequest.get('promotions').length > 0) {
	    			// we have promotion
	    			for(var i=0; i<this.currentRequest.get('promotions').length; i++) {
	    				var promotion_id = this.currentRequest.get('promotions').at(i).get('promotion').get('id');
	    				
	    				for(var j=0; j< json.allpromotions.length; j++){
	    					if(json.allpromotions[j].id == promotion_id) {
	    						json.allpromotions[j].checked = true;
	    					}
	    				}
	    				
	    			}
	    		}
	    		
	    	}
	    	
	    	this.$el.find("#quotationItemTbl").html(this.quotationItemTblTemplate(json));
	    	
	    	
	    	this.$el.find("#etcFeeSbx").spinbox({step:100, max: 90000});
	    	this.$el.find('.itemQuantitySbx').spinbox();
		}
		
		
		
		 // now make 'em sortable
		 $("#quotationItemTbl tbody").sortable({
			 placeholder: "highlight",
			 handle : ".handle",
			 helper: this.fixHelperModified,
			 stop: _.bind(function( event, ui ) {
				this.reorderQutationItem();
			 },this)
		 }).disableSelection();
		
		 // at las make sure they are shown
		 if(this.currentRequest.get('samples').length > 0) {
			 this.$el.find('#quotationItemTbl').show();
		 }
    	return this;
	},
	
	renderCompany: function() {
		var json={};
//		if( this.currentRequest.get('company') !=null) 
//			json.company = this.currentRequest.get('company').toJSON();
//		
//		if(this.currentRequest.get('address') != null) {
//			var address = this.currentRequest.get('address')
//			json.address = address.toJSON();
//			if(json.address.line1 == null || json.address.line1.length == 0) {
//				json.address.line1 = json.address.line1FromOldAddress;
//				json.address.line2 = json.address.line2FromOldAddress;
//				
//			}
//		}
//		
//		
//		if(this.currentRequest.get('contact') !=null)
//			json.contact = this.currentRequest.get('contact').toJSON();
		
		if( this.currentRequest.get('company') !=null) {
			json.company = this.currentRequest.get('company').toJSON();
			if(json.company.addresses.length > 0) {
				json.useAddresses = true;
			} else {
				json.useAddresses = false;
			}
			this.$el.find('#companyInfoDiv').html(this.companyInfoTemplate(json));
		}
	},
	
    render: function() {
    	var json = {};
    	if(this.currentRequest != null) {
    		json.model = this.currentRequest.toJSON();
    	}
    	
    	json.sampleTypes = sampleTypes.toJSON();
    	json.mainOrgs = mainOrgs.toJSON();
    	
    	
    	json.speedEnum = speedEnum;
    	json.reportLanguageEnum = reportLanguageEnum;
    	json.reportDeliveryMethodEnum = reportDeliveryMethodEnum;
    	json.sampleOrgEnum = sampleOrgEnum;
    	
    	json.model.sampleOrg = "SARABUN";
    	
    	this.$el.html(this.requestViewTemplate(json));
    	
    	
    	if(this.currentRequest.get('samples').length == 0) {
    		this.$el.find('#quotationItemTbl').hide();
    	}
    	this.renderQuotationItemTbl();
    	
    	this.renderCompany();
    	
    	json = {};
    	
    	
    	
		this.calculateTotal();
		
		this.$el.find('#serviceNo').mask("SR#99-99-99-9999");
    	
    	return this;
    }
});
