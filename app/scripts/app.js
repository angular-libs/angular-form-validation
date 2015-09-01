'use strict';

/**
 * @ngdoc overview
 * @name formValidationApp
 * @description
 * # angularFormValidationApp
 *
 * Main module of the application.
 */
(function(){
	var _errorCodeProvider=function() {
	  var _url,_map;
	  _map={};
	  this.setErrorCodeUrl=function(url){
		  _url=url;
	  }
	  function init(data){
		  if(data){
		  	_map=data;
		  }
	  }
	  this.$get = ['$http','$log','$q',function ErrorCodeSerivce($http,$log,$q) {
		  var _service,def;
		  def=$q.defer();
		  _service={};
		  
		  if(_url){
			  $http.get(_url).then(function (response) {
				  init(response.data);
				  def.resolve(_map);
			  },function(resp){
				  def.reslove(_map);
				  $log.error('error while loading error codes',resp);
			  });  
		  }else{
			  def.resolve(_map);
		  }
		  _service.initMessage=function(msgObj){
			  def.promise.then(function(map){
				  if(!msgObj.message){
						msgObj.message=(map[msgObj.code])?map[msgObj.code]:msgObj.code;
				  }
			  });
		  };
		  return _service;
	  }];
	}
	var _validationMessageDirective=['$log',function($log){
		function _defaultMessage(){
			return {
				field:'',validation:'',code:'',message:''
			};
		}
		return {
			restrict: 'E',
			require:['^formValidation'],
			link:function(scope,element,attr,controllers){
				var _formValidationCtrl,_validationMessage;
				_validationMessage=angular.extend(_defaultMessage(),{
					field:attr.field,
					validation:attr.validation,
					code:attr.code,
					message:attr.message
				});
				_formValidationCtrl=controllers[0];
				_formValidationCtrl.addValidationMessage(_validationMessage);
			}
		}
	}];
	var _formValidationDirective=['$log','$timeout','errorCode',function($log,$timeout,errorCode){
		return {
			restrict: 'A',
			require:['form','formValidation'],
			controller:['$scope',function($scope){
				var _form_name,_validationMessages;
				_validationMessages=[];
				this.setFormName=function(name){
					_form_name=name;
				}
				this.addValidationMessage=function(msgObj){
					errorCode.initMessage(msgObj);
					_validationMessages.push(msgObj);
				}
				this.getValidationMessage=function(){
					return _validationMessages;
				}
				this.getFormValidations=function(errors,multiple){
					var formValidations=[];
					for(var k=0;k<_validationMessages.length;k++){
						 var validationName=_validationMessages[k].validation;
						 if(errors[validationName]){
							 for(var a=0;a<errors[validationName].length;a++){
								 if(errors[validationName][a].$name==_validationMessages[k].field){
									 formValidations.push(_validationMessages[k].message);
									 if(!multiple){
										 return formValidations;
									 }
								 }
							} 
						 }
					}
					return formValidations;
				}
			}],
			link:function(scope,element,attr,controllers){
				var _formCtrl,_formValidationCtrl;
				_formCtrl=controllers[0];
				_formValidationCtrl=controllers[1];
				element.on('submit',function(){
					if(_formCtrl.$invalid){
						_formCtrl.formValidations=_formValidationCtrl.getFormValidations(_formCtrl.$error,attr.multiple);
						$timeout(function(){
							scope.$apply();
						})
						return false;
					}else{
						_formCtrl.formValidations=undefined;
					}
				});
				if(!_formCtrl.$name){
					$log.error('form name is required',element);
					return;
				}
				_formValidationCtrl.setFormName(_formCtrl.$name);
			}
		}
	}];
	var _formErrorDirective=['$log','$timeout',function($log,$timeout){
		function templateFn(){
			var str='';
			str+='<div class="alert alert-danger alert-dismissible" role="alert"  ng-show="isHidden()" >';
			str+='<button type="button" class="close"  aria-label="Close" ng-click="hide()"><span aria-hidden="true">&times;</span></button>';
			str+=' <p ng-repeat="msg in form.formValidations" ng-bind="msg"></p>';
			str+='</div>';
			return str;
		}
		return {
			restrict: 'E',
			template:templateFn(),
			require:'^?form',
			scope:{},
			replace:true,
			link:function(scope,element,attr,controller){
				var _formName,_show,_serverElHidden;
				if(controller){
					_formName=controller.$name;
				}else{
					_formName=attr.name;
				}
				if(!_formName){
					$log.error('form name required!!',element);
					return;
				}
				_show=false;
				_serverElHidden=false;
				scope.isHidden=function(){
					return _show;
				}
				scope.hide=function(){
					_show=false;
				}
				function hideServerError(){
					if(attr.serverError && !_serverElHidden){
						$('.'+attr.serverError).hide();
						_serverElHidden=true;
					}
				}
				$timeout(function(){
					scope.form=scope.$parent[_formName];
					scope.$watch(function(){
						return scope.$parent[_formName].formValidations;
					},function(n){
						if(n){
							hideServerError();
							_show=true;
						}else{
							_show=false;
						}
					})
				},1000);
			}
		}
	}];
	angular.module('formValidation',[]);
	angular.module('formValidation').provider('errorCode',_errorCodeProvider);
	angular.module('formValidation').directive('validationMessage',_validationMessageDirective);
	angular.module('formValidation').directive('formValidation',_formValidationDirective);
	angular.module('formValidation').directive('formError',_formErrorDirective);
})();
