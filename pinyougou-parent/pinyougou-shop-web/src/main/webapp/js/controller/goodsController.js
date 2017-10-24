//控制层 
app.controller('goodsController', function($scope, $controller,$location, goodsService,
		uploadService, itemCatService,typeTemplateService) {

	$controller('baseController', {
		$scope : $scope
	});//继承

	//读取列表数据绑定到表单中  
	$scope.findAll = function() {
		goodsService.findAll().success(function(response) {
			$scope.list = response;
		});
	}

	//分页
	$scope.findPage = function(page, rows) {
		goodsService.findPage(page, rows).success(function(response) {
			$scope.list = response.rows;
			$scope.paginationConf.totalItems = response.total;//更新总记录数
		});
	}

	//查询实体 
	$scope.findOne = function() {
		var id=$location.search()['id'];
		if(id==null){
			return;
		}
		goodsService.findOne(id).success(function(response) {
			$scope.entity = response;
			editor.html($scope.entity.goodsDesc.introduction);
			$scope.entity.goodsDesc.itemImages=JSON.parse($scope.entity.goodsDesc.itemImages);
			$scope.entity.goodsDesc.customAttributeItems=JSON.parse($scope.entity.goodsDesc.customAttributeItems);		
			$scope.entity.goodsDesc.specificationItems=JSON.parse($scope.entity.goodsDesc.specificationItems);
		
			/**
			 * SKU列表规格转换
			 */
			for (var i = 0; i < $scope.entity.itemList.length; i++) {
				$scope.entity.itemList[i].spec=JSON.parse($scope.entity.itemList[i].spec);
			}
		});
	}

	//保存 
	$scope.save = function() {
		var serviceObject;//服务层对象  				
		if ($scope.entity.goods.id != null) {//如果有ID
			serviceObject = goodsService.update($scope.entity); //修改  
		} else {
			$scope.entity.goodsDesc.introduction = editor.html();
			serviceObject = goodsService.add($scope.entity);//增加 
		}
		serviceObject.success(function(response) {
			if (response.success) {
				alert("保存成功");
				$scope.entity = {};
				editor.html('');//清空富文本编辑器
			} else {
				alert(response.message);
			}
		});

	}

	//批量删除 
	$scope.dele = function() {
		//获取选中的复选框			
		goodsService.dele($scope.selectIds).success(function(response) {
			if (response.success) {
				$scope.reloadList();//刷新列表
			}
		});
	}

	$scope.searchEntity = {};//定义搜索对象 

	//搜索
	$scope.search = function(page, rows) {
		goodsService.search(page, rows, $scope.searchEntity).success(
				function(response) {
					$scope.list = response.rows;
					$scope.paginationConf.totalItems = response.total;//更新总记录数
				});
	}

	/**
	 * 上传图片
	 */
	$scope.uploadFile = function() {
		uploadService.uploadFile().success(function(response) {
			if (response.success) {
				$scope.image_entity.url = response.message;
			} else {
				alert(response.message);
			}
		}).error(function() {
			alert("上传发生错误");
		});
	}

	/**
	 * 添加图片列表
	 */

	$scope.entity = {
		goods : {},
		goodsDesc : {
			itemImages : [],
			specificationItems:[]
		},
		itemList:[]
	}//定义页面实体结构
	
	/**
	 * 添加图片列表
	 */
	$scope.add_image_entity = function() {
		$scope.entity.goodsDesc.itemImages.push($scope.image_entity);
	}

	/**
	 * 列表中移除图片
	 */
	$scope.remove_image_entity = function(index) {
		$scope.entity.goodsDesc.itemImages.splice(index, 1);
	}

	/**
	 * 返回一级分类列表数据
	 */
	$scope.selectitemCat1List = function() {
		itemCatService.findByParentId(0).success(function(response) {
			$scope.itemCat1List = response;
		});
	}

	/**
	 * 监控一级分类列表绑定变量返回二级分类列表数据
	 */

	$scope.$watch('entity.goods.category1Id', function(newValue, oldValue) {
		itemCatService.findByParentId(newValue).success(function(response) {
			$scope.itemCat2List = response;
		});
	});
	
	/**
	 * 监控二级分类列表绑定变量返回三级分类列表数据
	 */
	$scope.$watch('entity.goods.category2Id', function(newValue, oldValue) {
		itemCatService.findByParentId(newValue).success(function(response) {
			$scope.itemCat3List = response;
		});
		
	});
	
	/**
	 * 监控三级分类列表绑定变量返回模板id
	 */
	$scope.$watch('entity.goods.category3Id',function(newValue,oldValue){
		itemCatService.findOne(newValue).success(function(response) {
			$scope.entity.goods.typeTemplateId = response.typeId;
		});
	});
	
	/**
	 * 监控模板id返回相应的模板数据、扩展属性、规格数据
	 */
	$scope.$watch('entity.goods.typeTemplateId',function(newValue,oldValue){
		typeTemplateService.findOne(newValue).success(function(response){
			$scope.typeTemplate=response;
			$scope.typeTemplate.brandIds=JSON.parse(response.brandIds);
			if($location.search()['id']==null){
				$scope.entity.goodsDesc.customAttributeItems=JSON.parse(response.customAttributeItems);
			}
			
		});
		
		typeTemplateService.findSpecList(newValue).success(function(response){
			$scope.specList=response;
		});
	});
	
	/**
	 * 点击更新选中的
	 */
	$scope.updateSpecAttribute=function($event,name,value){
		var specList=$scope.entity.goodsDesc.specificationItems;
		var object = $scope.searchObjectBykey(specList,"attributeName",name);
		if (object!=null) {
			if ($event.target.checked) {
				object.attributeValue.push(value);
			} else {
				object.attributeValue.splice(object.attributeValue.indexOf(value),1);
				if(object.attributeValue.length==0){
					specList.splice(specList.indexOf(object),1);
				}
			}
		} else {
			specList.push({attributeName:name,attributeValue:[value]});
		}
	}
	
	/**
	 * 创建SKU列表
	 */
	$scope.createItemList=function(){
		//初始化itemList
		$scope.entity.itemList=[{spec:{},price:0,num:1,status:'0',isDefault:'0'}];
		var items = $scope.entity.goodsDesc.specificationItems;
		for(var i=0;i<items.length;i++){
			$scope.entity.itemList=addColum($scope.entity.itemList,items[i].attributeName,items[i].attributeValue);
		}
	}
	
	/**
	 * 添加列值
	 * @param list
	 * @param columName
	 * @param columValues
	 * @returns {Array}
	 */
	addColum=function(list,columName,columValues){
		var newList=[];//新集合
		for(var i=0;i<list.length;i++){
			var oldRow=list[i];
			for(var j=0;j<columValues.length;j++){
				//深克隆
				var newRow = JSON.parse(JSON.stringify(oldRow));
				newRow.spec[columName]=columValues[j];
				newList.push(newRow);
			}
		}
		return newList;
	}
	
	/**
	 * 状态数组
	 */
	$scope.status=['未审核','已审核','审核不通过','关闭'];
	$scope.itemCatList=[];//商品分类列表
	/**
	 * 查询商品分类
	 */
	$scope.findItemCatList=function(){
		itemCatService.findAll().success(
			function(response){
				for(var i=0;i<response.length;i++){
					$scope.itemCatList[response[i].id]=response[i].name;
				}
			}
		);
	}
	
	
	
	/**
	 * 根据规格的名称和选项名称配合ng-checked判断复选框是否需要勾上
	 */
	$scope.checkAttributeValue=function(specName,optionName){
		var items=$scope.entity.goodsDesc.specificationItems;
		var object=$scope.searchObjectBykey(items,'attributeName',specName);
		if (object!=null) {
			if (object.attributeValue.indexOf(optionName)>=0) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
		
	
	/**
	 * 更新上下架状态
	 */
	$scope.updateMarketableStatus=function(status){
		goodsService.updateMarketableStatus($scope.selectIds,status).success(
				function(response){
					if(response.success){//成功
						$scope.reloadList();//刷新列表
						$scope.selectIds=[];//清空ID集合
					}else{
						alert(response.message);
					}
				}
			);		
	}
	
	
});