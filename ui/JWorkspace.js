;(function ($, factory) {

    $.Workspace = factory();

})(tssJS, function () {

    'use strict';

	var 
    /* 样式名 */
	CSS_CLASS_TAB_BOX_HAS_TAB = "hasTab",
	CSS_CLASS_TAB_ACTIVE      = "active",
	CSS_CLASS_PHASE_ACTIVE    = "active",
	CSS_CLASS_RIGHT_BOX       = "rightBox", 

	/* 点击Phase到展现内容的时间差(ms) */
	_TIMEOUT_PHASE_CLICK = 100,
	phaseClickTimeout,

	/* 自定义标签名（不含命名空间） */
	WS_NAMESPACE     = "WorkSpace",
	WS_TAG_PAGE      = "Page",
	WS_TAG_TAB       = "Tab",
	WS_TAG_TAB_BOX   = "TabBox",
	WS_TAG_PHASE     = "Phase";
	WS_TAG_PHASE_BOX = "PhaseBox",
	WS_TAG_ICON      = "Icon",
 
	/*******  Page: 负责管理单个子页面的显示、隐藏等控制 *********/
	Page = function (obj) {	
		this.object = obj;
		this.id = obj.id;		
		this.isActive = ( $.getStyle(obj, "display") == "none" ? false : true ); 
	};

	Page.prototype = {
		/* Page隐藏  */
		hide: function() {
			this.object.style.display = "none"; 
			this.isActive = false;
		},

		/* Page显示 */
		show: function() {
			this.object.style.display = "block";
			this.object.scrollTop  = 0;
			this.object.scrollLeft = 0;
			this.isActive = true;
		}
	};

	Page.getInstance = function(id) {
		return _display.pages[id];
	};

	/*******  Tab: 负责生成水平标签页 *********/
	var Tab = function(label, phasesParams, callback) {
		this.isActive = false;
		this.label = label;
		this.callback = callback;
		this.link ;
		
		this.phases = {};
		this.phasesParams = phasesParams;  
		
		this.object = Element.createNSElement(WS_TAG_TAB, WS_NAMESPACE);
		this.uniqueID = this.object.uniqueID;
		 
		var closeIcon = Element.createNSElement(WS_TAG_ICON, WS_NAMESPACE);
		closeIcon.title = "关闭";
		closeIcon._tab = this;		
		this.object.appendChild(closeIcon);
		
		var div = Element.createElement("div");
		div.innerText = this.label;
		div.title = this.label;
		div.noWrap = true; // 不换行
		div._target = this.object;
		this.object.appendChild(div);
		
		var oThis = this;
		closeIcon.onclick = this.object.ondblclick = function() {
			oThis.close();
		};	
		this.object.onclick = function() {
			if (!oThis.isActive && oThis.object) {
				oThis.click();
			}		
		};	
	};

	Tab.prototype = {

		close = function() {

			// 如果关闭的是当前激活的Tab，则需要在关闭完成后切换到第一个Tab
			var isCloseActiveTab = (this == _display.getActiveTab()); 
			if( isCloseActiveTab ) {
				this.clearPhases();
				if( this.link ) {
					this.hideLink();
				}
			}

			delete _display.tabs[this.uniqueID];

			Element.removeNode(this.object);
			
			Reminder.del(this.SID); // 解除提醒

			this.label = null;
			this.object = null;
			this.uniqueID = null;
			this.link = null;
			this.phases = {};
			this.phasesParams = null;

			// 执行Tab页上定义的回调方法
			this.execCallBack("onTabClose");

			delCacheData(this.SID);

			if( isCloseActiveTab ) {
				_display.switchToTab(_display.getFirstTab());
			}
		}

		/* 点击标签 */
		click = function() {
			_display.inactiveAllTabs();
			this.active();

			// 执行Tab页上定义的回调方法
			this.execCallBack("onTabChange");

			if( this.link ) {
				this.showLink();
				this.refreshPhases();
			}
		}

		/* 显示关联子页面  */
		showLink = function() {
			_display.showPage(this.link);
		}

		/* 关闭（隐藏）关联子页面 */
		hideLink = function() {
			_display.hidePage(this.link);
		}

		/* 高亮标签 */
		active = function() {
			Element.addClass(this.object, CSS_CLASS_TAB_ACTIVE);
			this.isActive = true;
		}

		/* 低亮标签  */
		inactive = function() {
			Element.removeClass(this.object, CSS_CLASS_TAB_ACTIVE);
			this.isActive = false;
		}

		/* 将标签与Page对象关联 */
		linkTo = function(pageInstance) {
			this.link = pageInstance;
		}

		/*
		 *	将标签插入指定容器
		 *	参数：	object:container		HTML容器对象
		 */
		dockTo = function(container) {
			container.appendChild(this.object);
		}

		/* 以文本方式输出对象信息 */
		toString = function() {
			var str = [];
			str[str.length] = "[Tab 对象]";
			str[str.length] = "uniqueID = \"" + this.uniqueID+ "\"";
			str[str.length] = "label = \"" + this.label+ "\"";
			return str.join("\r\n");
		}

		/*
		 *	切换到指定Tab页
		 *	参数：Phase:phase       Phase实例
		 */
		switchToPhase = function(phase) {
			if( phase ) {
				phase.click();
			}		
		}

		/* 刷新纵向标签  */
		refreshPhases = function() {
			this.clearPhases();
			
			if( this.phasesParams == null ) return;

			// 重新创建纵向标签
			for(var i=0; i < this.phasesParams.length; i++) {
				var param = this.phasesParams[i];
				var pageId = param.page;
				var page   = Page.getInstance(pageId);

				var phase  = new Phase(param.label);
				phase.linkTo(page);
				phase.dockTo(_display.phaseBox);
				if(pageId == this.link.id) {
					phase.active();
				}

				this.phases[phase.uniqueID] = phase;
			}

			_display.showRightBox();
		}

		/* 清除纵向标签  */
		clearPhases = function() {
			for(var item in this.phases) {
				var phase = this.phases[item];
				phase.dispose();
			}
			_display.phaseBox.innerHTML = "";
		}

		/* 低亮所有Phase标签 */
		inactiveAllPhases = function() {
			for(var item in this.phases) {
				var curPhase = this.phases[item];
				curPhase.inactive();
			}
		}

		/* 获取激活的纵向标签 */
		getActivePhase = function() {
			for(var item in this.phases) {
				var curPhase = this.phases[item];
				if( curPhase.isActive ) {
					return curPhase;
				}
			}
		}

		/* 激活上一个纵向标签  */
		prevPhase = function() {       
			var tempPhases = [];
			var activePhaseIndex = null;
			for(var item in this.phases) {
				var curPhase = this.phases[item];
				if( curPhase.isActive ) {
					activePhaseIndex = tempPhases.length;
				}
				tempPhases[tempPhases.length] = curPhase;
			}
			
			var phase;
			if(0 == activePhaseIndex) { // 当前激活的是第一个Phase，即到顶了
				phase = tempPhases[activePhaseIndex];
			} else {
				phase = tempPhases[activePhaseIndex - 1];
			}
			this.switchToPhase(phase);
		}

		/* 激活下一个纵向标签 */
		nextPhase = function() {
			var tempPhases = [];
			var activePhaseIndex;
			for(var item in this.phases) {
				var curPhase = this.phases[item];
				if( curPhase.isActive ) {
					activePhaseIndex = tempPhases.length;
				}
				tempPhases[tempPhases.length] = curPhase;
			}
			
			var phase;
			if(tempPhases.length - 1 == activePhaseIndex) { // 当前激活的是最后一个Phase，即到末尾了
				phase = tempPhases[activePhaseIndex];
			} else {
				phase = tempPhases[activePhaseIndex + 1];
			}
			this.switchToPhase(phase);
		}

		/*
		 *	执行回调函数
		 *	参数：  string:eventName        事件名称
					object:params           回调函数可用参数
		 */
		execCallBack = function(eventName, params) {
			if( this.callback != null) {
				Public.executeCommand(this.callback[eventName], params);
			}
		}
	};

 
	Tab.getInstance = function(id) {
		return _display.tabs[id];
	}


/* ***********************************************************************************************
 *	对象名称：Phase
 *	职责：负责生成右侧纵向标签页
 * ***********************************************************************************************/
function Phase(label) {
	this.label = label;
	this.link;
	this.isActive = false;
	
	this.object = Element.createNSElement(WS_TAG_PHASE, WS_NAMESPACE);
	this.uniqueID = this.object.uniqueID;
	
	var div = Element.createElement("div");
	div.innerText = this.label;
	div.title = this.label;
	div.noWrap = true;
	div._target = this.object;
	
	this.object.appendChild(div);       
	
	var oThis = this;
	this.object.onclick = function() {
		if (!oThis.isActive) {
			oThis.click();
		}		
	};	
}

/* 将标签与Page对象关联  */
Phase.prototype.linkTo = function(pageInstance) {
	this.link = pageInstance;
}

/* 将标签插入指定容器 */
Phase.prototype.dockTo = function(container) {
	container.appendChild(this.object);
}

/* 释放纵向标签实例 */
Phase.prototype.dispose = function() {
	var curActiveTab = _display.getActiveTab();
	delete curActiveTab.phases[this.uniqueID];

	Element.removeNode(this.object);

	this.label = null;
	this.object = null;
	this.uniqueID = null;
	this.link = null;
}

/* 点击标签  */
Phase.prototype.click = function() {
	var curActiveTab = _display.getActiveTab();
	curActiveTab.inactiveAllPhases();

	this.active();
	this.scrollToView();

	var thisPhase = this;

	//避免切换太快时显示内容跟不上响应
	clearTimeout( phaseClickTimeout );
	
	phaseClickTimeout = setTimeout( function() {
		if( thisPhase.link ) {
			/* 显示关联子页面 */
			_display.showPage  (thisPhase.link);
			curActiveTab.linkTo(thisPhase.link);
		}
	}, _TIMEOUT_PHASE_CLICK );
}

/* 将控制标签显示在可见区域内 */
Phase.prototype.scrollToView = function() {
	var tempTop = this.object.offsetTop;
	var tempBottom = this.object.offsetTop + this.object.offsetHeight;
	var areaTop = _display.phaseBox.scrollTop;
	var areaBottom = areaTop + _display.phaseBox.offsetHeight;
	if(tempTop < areaTop) {
		_display.phaseBox.scrollTop = tempTop;
	}
	else if(tempBottom > areaBottom) {
		_display.phaseBox.scrollTop = tempBottom - _display.phaseBox.offsetHeight;
	}
}

/* 高亮纵向标签 */
Phase.prototype.active = function() {
	Element.addClass(this.object, CSS_CLASS_PHASE_ACTIVE);
	this.isActive = true;
}

/* 低亮纵向标签 */
Phase.prototype.inactive = function() {
	Element.removeClass(this.object, CSS_CLASS_PHASE_ACTIVE);
	this.isActive = false;
}

/* 以文本方式输出对象信息 */
Phase.prototype.toString = function() {
	var str = [];
	str[str.length] = "[Phase 对象]";
	str[str.length] = "uniqueID = \"" + this.uniqueID+ "\"";
	str[str.length] = "label = \"" + this.label+ "\"";
	return str.join("\r\n");
}

/* 根据id获取Phase实例 */
Phase.getInstance = function(uniqueID) {
	var curActiveTab = _display.getActiveTab();
	return curActiveTab.phases[uniqueID];
}

/* ***********************************************************************************************
 *	对象名称：Display
 *	职责：负责生成整体界面显示
 * ************************************************************************************************/
function Display(element) {
	this.element = element;

	this.tabBox;
	this.phaseBox;
	this.rightBox;

	this.tabs = {};
	this.pages = {};

	// 初始化
	this.getAllPages();
	this.hideAllPages();
	this.createUI();
}

/* 获取所有子页面 */
Display.prototype.getAllPages = function() {
	var childs = Element.getNSElements(this.element, WS_TAG_PAGE, WS_NAMESPACE);
	for(var i=0; i < childs.length; i++) {
		var curNode = childs[i]; 
		// curNode.style.height = curNode.offsetHeight - 300;
		this.pages[curNode.id || curNode.uniqueID] = new Page(curNode);
	}
}

/* 隐藏所有子页面  */
Display.prototype.hideAllPages = function() {
	for(var item in this.pages) {
		var curPage = this.pages[item];
		if(curPage.isActive) {
			curPage.hide();
		}
	}
}

/* 创建界面展示 */
Display.prototype.createUI = function() {
	this.createTabBox();
	this.createRightBox();
	this.createPhaseBox();
	this.hideRightBox();
}

/* 创建Tab标签的容器 */
Display.prototype.createTabBox = function() {
	var tabBox = Element.createNSElement(WS_TAG_TAB_BOX, WS_NAMESPACE);
	var nobr   = Element.createElement("nobr");

	tabBox.appendChild(nobr);
	this.element.appendChild(tabBox);
	
	var refChild = this.element.firstChild;
	if(refChild != tabBox) {
		this.element.insertBefore(tabBox, refChild); // 插入到第一个
	}

	this.tabBox = tabBox;
}

/* 创建右侧容器 */
Display.prototype.createRightBox = function() {
	var rightBox = Element.createNSElement("table");
	rightBox.cellSpacing = 0;
	rightBox.cellPadding = 0;
	rightBox.border = 0;
	Element.addClass(rightBox, CSS_CLASS_RIGHT_BOX);

	var row = rightBox.insertRow();
	row.insertCell();

	this.element.appendChild(rightBox);
	var refChild = this.element.childNodes[1];
	if(rightBox != refChild && refChild) {
		this.element.insertBefore(rightBox, refChild);
	}

	this.rightBox = rightBox;
}

/* 创建纵向Tab标签的容器 */
Display.prototype.createPhaseBox = function() {
	var phaseBox = Element.createNSElement(WS_TAG_PHASE_BOX, WS_NAMESPACE);
	this.rightBox.rows[0].cells[0].appendChild(phaseBox);
	this.phaseBox = phaseBox;
}

/* 显示右侧容器 */
Display.prototype.showRightBox = function() {
	this.rightBox.style.display = "inline";
}

/* 隐藏右侧容器 */
Display.prototype.hideRightBox = function() {
	this.rightBox.style.display = "none";
} 

/*
 *	打开一个新子页
 *	参数：	object:inf 配置参数
 *	返回值：Tab:tab    Tab标签实例
 */
Display.prototype.open = function(inf) {
	var tab = this.getTabBySID(inf.SID);
	
	// 不存在同一数据源tab则新建
	if(null == tab) {             
		tab = new Tab(inf.label, inf.phases, inf.callback);
		this.tabs[tab.uniqueID] = tab;

		var page = this.getPage(inf.defaultPage);
		tab.linkTo(page);
		tab.dockTo(this.tabBox.firstChild);
		tab.SID = inf.SID; // 标记数据源

		this.setHasTabStyle(true);
	}
	
	tab.click();
	return tab;
}

/*
 *	设置有Tab标签的容器样式
 *	参数：boolean:hasTab     容器是否有Tab
 */
Display.prototype.setHasTabStyle = function(hasTab) {
	if(hasTab) {
		Element.addClass(this.tabBox, CSS_CLASS_TAB_BOX_HAS_TAB);
	} else {
		Element.removeClass(this.tabBox, CSS_CLASS_TAB_BOX_HAS_TAB);
	}
}

/*
 *	根据id查找子页
 *	参数：	string:id		子页id
 */
Display.prototype.getPage = function(id) {
	return this.pages[id];
}
/*
 *	显示子页面
 *	参数：	Page:page		Page实例
 */
Display.prototype.showPage = function(page) {
	this.hideAllPages();
	page.show();
}
/*
 *	关闭（隐藏）子页面
 *	参数：	Page:page		Page实例
 */
Display.prototype.hidePage = function(page) {
	page.hide();
}

/* 获得第一个Tab */
Display.prototype.getFirstTab = function() {
	for(var item in this.tabs) {
		return this.tabs[item];
	}
}

/*
 *	切换到指定Tab页
 *	参数：Tab:tab   Tab实例
 */
Display.prototype.switchToTab = function(tab) {
	if( tab ) {
		tab.click();
	} 
	else {
		this.setHasTabStyle(false);
	}
}

/* 低亮所有标签 */
Display.prototype.inactiveAllTabs = function() {
	for(var item in this.tabs) {
		var curTab = this.tabs[item];
		curTab.inactive();
	}
}

/* 获取当前激活标签 */
Display.prototype.getActiveTab = function() {
	for(var item in this.tabs) {
		var tab = this.tabs[item];
		if( tab.isActive ) {
			return tab;
		}
	}
}

/*
 *	根据SID获取Tab
 *	参数：  string:SID 
 */
Display.prototype.getTabBySID = function(SID) {
	for(var item in this.tabs) {
		if(SID == this.tabs[item].SID) {
			return this.tabs[item];
		}
	}
}


/* ***********************************************************************************************
   控件名称：标签式工作区
   功能说明：1、动态创建Tab标签
			 2、动态创建纵向Tab标签
			 3、Tab标签控制子页面显示
			 4、双击Tab标签可关闭 
* ***********************************************************************************************/
var _display;

var WorkSpace = function(wsElement) {
	_display = new Display(wsElement);
}
 
/* 打开子页面  */
WorkSpace.prototype.open = function(inf) {
	return _display.open(inf);
}

/* 获取当前激活标签 */
WorkSpace.prototype.getActiveTab = function() {
	return _display.getActiveTab();
}

/* 关闭当前激活标签 */
WorkSpace.prototype.closeActiveTab = function() {
	var tab = this.getActiveTab();
	if( tab ) {
		tab.close();
	}
}
 
/* 激活上一个Phase标签 */
WorkSpace.prototype.prevPhase = function() {
	var tab = this.getActiveTab();
	if( tab ) {
		return tab.prevPhase();
	}
}

/* 激活下一个Phase标签 */
WorkSpace.prototype.nextPhase = function() {
	var tab = this.getActiveTab();
	if( tab ) {
		return tab.nextPhase();
	}
}

WorkSpace.prototype.switchToPhase = function(pageId) {
	var page = _display.getPage(pageId);
	_display.showPage(page);
}

WorkSpace.prototype.noTabOpend = function() {
	var length = 0; 
	for(var item in _display.tabs) {
		length ++;
	}
	return length == 0;
}