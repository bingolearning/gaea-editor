"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var mobx_1 = require('mobx');
var _ = require('lodash');
var LZString = require('lz-string');

var Viewport = function () {
    function Viewport(application) {
        _classCallCheck(this, Viewport);

        this.components = mobx_1.map();
        this.isMovingComponent = false;
        this.showLayoutBorder = false;
        this.viewportHoverComponentSpec = {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            hovering: false
        };
        this.treeHoverComponentSpec = {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            hovering: false
        };
        this.dragStartParentElement = null;
        this.dragStartIndex = 0;
        this.currentHoverElement = null;
        this.currentEditComponentMapUniqueKey = null;
        this.oldProps = null;
        this.lastSelectMapUniqueKey = null;
        this.operates = [];
        this.nowOperateIndex = -1;
        this.dragTargetMapUniqueKey = null;
        this.dragTargetIndex = -1;
        this.hoveringComponentMapUniqueKey = null;
        this.copyComponent = null;
        this.isShowSidebarAddon = false;
        this.isShowLeftBar = false;
        this.leftBarType = '';
        this.showEditorPanelShadow = false;
        this.application = application;
    }

    _createClass(Viewport, [{
        key: "createRootUniqueId",
        value: function createRootUniqueId() {
            this.rootMapUniqueKey = this.createUniqueId();
            return this.rootMapUniqueKey;
        }
    }, {
        key: "setRootUniqueId",
        value: function setRootUniqueId(uniqueId) {
            this.rootMapUniqueKey = uniqueId;
        }
    }, {
        key: "setComponents",
        value: function setComponents(mapUniqueKey, componentInfo) {
            this.components.set(mapUniqueKey, componentInfo);
        }
    }, {
        key: "createUniqueId",
        value: function createUniqueId() {
            return _.uniqueId('gaea-component-' + new Date().getTime() + '-');
        }
    }, {
        key: "resetComponent",
        value: function resetComponent(mapUniqueKey) {
            var component = this.components.get(mapUniqueKey);
            var ComponentClass = this.application.getComponentByUniqueKey(component.props.gaeaUniqueKey);
            this.saveOperate({
                type: 'reset',
                mapUniqueKey: mapUniqueKey,
                reset: {
                    beforeProps: JSON.parse(JSON.stringify(component.props)),
                    beforeName: component.props.name
                }
            });
            mobx_1.transaction(function () {
                component.props = mobx_1.extendObservable({}, _.cloneDeep(ComponentClass.defaultProps));
            });
        }
    }, {
        key: "addComponent",
        value: function addComponent(parentMapUniqueKey, index) {
            if (this.currentMovingComponent.uniqueKey === 'combo') {
                var copyCombo = this.createCopyComponentWithNewUniqueKey(this.application.comboComponents[this.dragStartIndex], parentMapUniqueKey);
                this.addComplexComponent(parentMapUniqueKey, copyCombo.mapUniqueKey, index, copyCombo);
                return {
                    mapUniqueKey: copyCombo.mapUniqueKey,
                    component: copyCombo
                };
            } else if (this.currentMovingComponent.uniqueKey === 'source') {
                var copySource = this.createCopyComponentWithNewUniqueKey(JSON.parse(LZString.decompressFromBase64(this.currentMovingComponent.source)), parentMapUniqueKey);
                this.addComplexComponent(parentMapUniqueKey, copySource.mapUniqueKey, index, copySource);
                return {
                    mapUniqueKey: copySource.mapUniqueKey,
                    component: copySource
                };
            } else {
                var mapUniqueKey = void 0;
                if (this.currentMovingComponent.isNew) {
                    mapUniqueKey = this.createUniqueId();
                    this.addNewComponent(mapUniqueKey, parentMapUniqueKey, this.currentMovingComponent.uniqueKey, index);
                } else {
                    mapUniqueKey = this.currentMovingComponent.mapUniqueKey;
                    this.addToParent(mapUniqueKey, parentMapUniqueKey, index);
                }
                return {
                    mapUniqueKey: mapUniqueKey,
                    component: null
                };
            }
        }
    }, {
        key: "sortComponents",
        value: function sortComponents(parentMapUniqueKey, beforeIndex, afterIndex) {
            var layoutChilds = this.components.get(parentMapUniqueKey).layoutChilds;
            if (beforeIndex < afterIndex) {
                mobx_1.transaction(function () {
                    for (var index = beforeIndex; index < afterIndex; index++) {
                        var beforeUniqueKey = layoutChilds[index];
                        var afterUniqueKey = layoutChilds[index + 1];
                        layoutChilds[index] = afterUniqueKey;
                        layoutChilds[index + 1] = beforeUniqueKey;
                    }
                });
            } else {
                mobx_1.transaction(function () {
                    for (var index = beforeIndex; index > afterIndex; index--) {
                        var beforeUniqueKey = layoutChilds[index];
                        var afterUniqueKey = layoutChilds[index - 1];
                        layoutChilds[index] = afterUniqueKey;
                        layoutChilds[index - 1] = beforeUniqueKey;
                    }
                });
            }
        }
    }, {
        key: "startDragging",
        value: function startDragging(childMapUniqueKey, uniqueKey, isNew) {
            var dragStartParentElement = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
            var dragStartIndex = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];
            var source = arguments.length <= 5 || arguments[5] === undefined ? '' : arguments[5];

            this.isMovingComponent = true;
            this.dragStartParentElement = dragStartParentElement;
            this.dragStartIndex = dragStartIndex;
            this.currentMovingComponent = {
                mapUniqueKey: childMapUniqueKey,
                uniqueKey: uniqueKey,
                isNew: isNew,
                source: source
            };
        }
    }, {
        key: "endDragging",
        value: function endDragging() {
            this.isMovingComponent = false;
        }
    }, {
        key: "setShowLayoutBorder",
        value: function setShowLayoutBorder(isShow) {
            this.showLayoutBorder = isShow;
        }
    }, {
        key: "setRootDomInstance",
        value: function setRootDomInstance(rootDomInstance) {
            this.rootDomInstance = rootDomInstance;
        }
    }, {
        key: "setViewportDomInstance",
        value: function setViewportDomInstance(viewportDomInstance) {
            this.viewportDomInstance = viewportDomInstance;
        }
    }, {
        key: "setSectionContainerDomInstance",
        value: function setSectionContainerDomInstance(sectionContainerDomInstance) {
            this.sectionContainerDomInstance = sectionContainerDomInstance;
        }
    }, {
        key: "setHoverComponent",
        value: function setHoverComponent(element) {
            this.currentHoverElement = element;
            this.resetComponentOutline();
        }
    }, {
        key: "resetComponentOutline",
        value: function resetComponentOutline() {
            var _this = this;

            if (this.currentHoverElement === null) {
                return;
            }
            var targetBoundingClientRect = this.currentHoverElement.getBoundingClientRect();
            var viewportBoundingClientRect = this.viewportDomInstance.getBoundingClientRect();
            mobx_1.transaction(function () {
                _this.viewportHoverComponentSpec = {
                    left: targetBoundingClientRect.left - viewportBoundingClientRect.left,
                    top: targetBoundingClientRect.top - viewportBoundingClientRect.top,
                    width: targetBoundingClientRect.width,
                    height: targetBoundingClientRect.height,
                    hovering: true
                };
            });
        }
    }, {
        key: "setLeaveHover",
        value: function setLeaveHover() {
            this.viewportHoverComponentSpec.hovering = false;
            this.currentHoverElement = null;
        }
    }, {
        key: "setTreeLeaveHover",
        value: function setTreeLeaveHover() {
            this.treeHoverComponentSpec.hovering = false;
        }
    }, {
        key: "setTreeDomInstance",
        value: function setTreeDomInstance(treeDomInstance) {
            this.treeDomInstance = treeDomInstance;
        }
    }, {
        key: "setHoverTreeComponent",
        value: function setHoverTreeComponent(element) {
            var _this2 = this;

            var targetBoundingClientRect = element.getBoundingClientRect();
            var treeBoundingClientRect = this.treeDomInstance.getBoundingClientRect();
            mobx_1.transaction(function () {
                _this2.treeHoverComponentSpec = {
                    left: targetBoundingClientRect.left - treeBoundingClientRect.left,
                    top: targetBoundingClientRect.top - treeBoundingClientRect.top,
                    width: element.clientWidth,
                    height: element.clientHeight,
                    hovering: true
                };
            });
        }
    }, {
        key: "setCurrentEditComponentMapUniqueKey",
        value: function setCurrentEditComponentMapUniqueKey(mapUniqueKey) {
            this.currentEditComponentMapUniqueKey = mapUniqueKey;
            this.showSidebarAddon();
        }
    }, {
        key: "cancelEditComponent",
        value: function cancelEditComponent() {
            this.currentEditComponentMapUniqueKey = null;
            this.hideSidebarAddon();
            if (this.lastSelectMapUniqueKey !== null) {
                this.application.event.emit(this.application.event.changeComponentSelectStatusEvent, {
                    mapUniqueKey: this.lastSelectMapUniqueKey,
                    selected: false
                });
                this.setLastSelectMapUniqueKey(null);
            }
        }
    }, {
        key: "findComponentPathFromRoot",
        value: function findComponentPathFromRoot(mapUniqueKey) {
            var finderPath = [mapUniqueKey];
            var nowComponent = this.components.get(mapUniqueKey);
            if (nowComponent.parentMapUniqueKey === null) {
                return [];
            }
            while (this.components.get(nowComponent.parentMapUniqueKey).parentMapUniqueKey !== null) {
                finderPath.unshift(nowComponent.parentMapUniqueKey);
                nowComponent = this.components.get(nowComponent.parentMapUniqueKey);
            }
            return finderPath;
        }
    }, {
        key: "updateComponentOptionsValue",
        value: function updateComponentOptionsValue(editOptions, value) {
            var componentInfo = this.components.get(this.currentEditComponentMapUniqueKey);
            var oldValue = JSON.parse(JSON.stringify(componentInfo.props));
            this.updateComponentOptionsValueByOptions(this.currentEditComponentMapUniqueKey, editOptions, value);
            var newValue = JSON.parse(JSON.stringify(componentInfo.props));
            this.saveOperate({
                type: 'update',
                mapUniqueKey: this.currentEditComponentMapUniqueKey,
                update: {
                    oldValue: oldValue,
                    newValue: newValue
                }
            });
        }
    }, {
        key: "updateComponentValue",
        value: function updateComponentValue(field, value) {
            var componentInfo = this.components.get(this.currentEditComponentMapUniqueKey);
            var oldValue = JSON.parse(JSON.stringify(componentInfo.props));
            this.setPropsByField(componentInfo.props, field, value);
            var newValue = JSON.parse(JSON.stringify(componentInfo.props));
            this.saveOperate({
                type: 'update',
                mapUniqueKey: this.currentEditComponentMapUniqueKey,
                update: {
                    oldValue: oldValue,
                    newValue: newValue
                }
            });
        }
    }, {
        key: "prepareWriteHistory",
        value: function prepareWriteHistory() {
            var componentInfo = this.components.get(this.currentEditComponentMapUniqueKey);
            this.oldProps = JSON.parse(JSON.stringify(componentInfo.props));
        }
    }, {
        key: "writeHistory",
        value: function writeHistory() {
            var componentInfo = this.components.get(this.currentEditComponentMapUniqueKey);
            var newValue = JSON.parse(JSON.stringify(componentInfo.props));
            this.saveOperate({
                type: 'update',
                mapUniqueKey: this.currentEditComponentMapUniqueKey,
                update: {
                    oldValue: this.oldProps,
                    newValue: newValue
                }
            });
        }
    }, {
        key: "updateComponentValueWithNoHistory",
        value: function updateComponentValueWithNoHistory(field, value) {
            var componentInfo = this.components.get(this.currentEditComponentMapUniqueKey);
            this.setPropsByField(componentInfo.props, field, value);
        }
    }, {
        key: "updateComponentOptionsValueByOptions",
        value: function updateComponentOptionsValueByOptions(mapUniqueKey, editOptions, value) {
            var componentInfo = this.components.get(mapUniqueKey);
            this.setPropsByFieldWithEditor(componentInfo.props, editOptions, value);
        }
    }, {
        key: "getPropsByField",
        value: function getPropsByField(props, editOptions) {
            return _.at(props, editOptions.field);
        }
    }, {
        key: "getPropsByFieldWithEditor",
        value: function getPropsByFieldWithEditor(props, editOptions) {
            var value = this.getPropsByField(props, editOptions);
            if (value === null || value === editOptions.emptyValue) {
                return '';
            }
            return value;
        }
    }, {
        key: "setPropsByField",
        value: function setPropsByField(props, field, value) {
            _.set(props, field, value);
        }
    }, {
        key: "setPropsByFieldWithEditor",
        value: function setPropsByFieldWithEditor(props, editOptions, value) {
            switch (editOptions.type) {
                case 'string':
                    value = value.toString();
                    break;
                case 'number':
                    value = Number(value);
                    break;
                case 'boolean':
                    value = Boolean(value);
                    break;
            }
            if (value === '') {
                value = editOptions.emptyValue || null;
            }
            this.setPropsByField(props, editOptions.field, value);
        }
    }, {
        key: "setLastSelectMapUniqueKey",
        value: function setLastSelectMapUniqueKey(mapUniqueKey) {
            this.lastSelectMapUniqueKey = mapUniqueKey;
        }
    }, {
        key: "getIncrementComponentsInfo",
        value: function getIncrementComponentsInfo() {
            var _this3 = this;

            var cloneComponents = JSON.parse(JSON.stringify(this.components.toJSON()));
            Object.keys(cloneComponents).map(function (key) {
                cloneComponents[key] = _this3.application.cleanComponent(cloneComponents[key]);
            });
            return LZString.compressToBase64(JSON.stringify(cloneComponents));
        }
    }, {
        key: "addNewComponent",
        value: function addNewComponent(mapUniqueKey, parentMapUniqueKey, uniqueId, index) {
            var ComponentClass = this.application.getComponentByUniqueKey(uniqueId);
            var newProps = mobx_1.extendObservable({}, _.cloneDeep(ComponentClass.defaultProps));
            var component = {
                props: newProps,
                parentMapUniqueKey: parentMapUniqueKey
            };
            if (uniqueId === 'gaea-layout') {
                component.layoutChilds = [];
            }
            this.setComponents(mapUniqueKey, component);
            this.components.get(parentMapUniqueKey).layoutChilds.splice(index, 0, mapUniqueKey);
        }
    }, {
        key: "addToParent",
        value: function addToParent(mapUniqueKey, parentMapUniqueKey, index) {
            this.components.get(mapUniqueKey).parentMapUniqueKey = parentMapUniqueKey;
            this.components.get(parentMapUniqueKey).layoutChilds.splice(index, 0, mapUniqueKey);
        }
    }, {
        key: "addComplexComponent",
        value: function addComplexComponent(parentMapUniqueKey, mapUniqueKey, index, componentFullInfo) {
            var _this4 = this;

            Object.keys(componentFullInfo.childs).forEach(function (childMapUniqueKey) {
                var expendComponentInfo = _this4.application.expendComponent(JSON.parse(JSON.stringify(componentFullInfo.childs[childMapUniqueKey])));
                var component = {
                    props: mobx_1.extendObservable({}, expendComponentInfo.props),
                    parentMapUniqueKey: expendComponentInfo.parentMapUniqueKey
                };
                if (expendComponentInfo.props.gaeaUniqueKey === 'gaea-layout') {
                    component.layoutChilds = expendComponentInfo.layoutChilds || [];
                }
                _this4.setComponents(childMapUniqueKey, component);
            });
            var expendRootComponentInfo = this.application.expendComponent(JSON.parse(JSON.stringify(componentFullInfo.componentInfo)));
            var rootComponent = {
                props: mobx_1.extendObservable({}, expendRootComponentInfo.props),
                parentMapUniqueKey: expendRootComponentInfo.parentMapUniqueKey
            };
            if (expendRootComponentInfo.props.gaeaUniqueKey === 'gaea-layout') {
                rootComponent.layoutChilds = expendRootComponentInfo.layoutChilds || [];
            }
            this.setComponents(mapUniqueKey, rootComponent);
            this.addToParent(mapUniqueKey, parentMapUniqueKey, index);
        }
    }, {
        key: "initLastOperateComponents",
        value: function initLastOperateComponents(lastOperateComponents) {
            this.lastOperateComponents = lastOperateComponents;
        }
    }, {
        key: "saveOperate",
        value: function saveOperate(diff) {
            this.operates.splice(this.nowOperateIndex + 1);
            this.operates.push(diff);
            this.nowOperateIndex = this.operates.length - 1;
        }
    }, {
        key: "deleteComponent",
        value: function deleteComponent(mapUniqueKey) {
            var _this5 = this;

            var deleteChildComponents = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var parentComponent = this.components.get(this.components.get(mapUniqueKey).parentMapUniqueKey);
            var childIndex = parentComponent.layoutChilds.findIndex(function (item) {
                return item === mapUniqueKey;
            });
            parentComponent.layoutChilds.splice(childIndex, 1);
            var component = this.components.get(mapUniqueKey);
            if (component.props.gaeaUniqueKey === 'gaea-layout') {
                JSON.parse(JSON.stringify(component.layoutChilds)).forEach(function (componentMapUniqueKey) {
                    deleteChildComponents[componentMapUniqueKey] = JSON.parse(JSON.stringify(_this5.components.get(componentMapUniqueKey)));
                    _this5.deleteComponent(componentMapUniqueKey, deleteChildComponents);
                });
            }
            this.components.delete(mapUniqueKey);
            return deleteChildComponents;
        }
    }, {
        key: "undo",
        value: function undo() {
            if (this.nowOperateIndex <= -1) {
                return;
            }
            this.cancelEditComponent();
            var operate = this.operates[this.nowOperateIndex];
            switch (operate.type) {
                case 'add':
                    this.deleteComponent(operate.mapUniqueKey);
                    break;
                case 'update':
                    this.components.get(operate.mapUniqueKey).props = mobx_1.extendObservable({}, _.cloneDeep(operate.update.oldValue));
                    break;
                case 'exchange':
                    this.sortComponents(operate.mapUniqueKey, operate.exchange.newIndex, operate.exchange.oldIndex);
                    break;
                case 'move':
                    var mapUniqueKey = this.components.get(operate.move.targetParentMapUniqueKey).layoutChilds.splice(operate.move.targetIndex, 1)[0];
                    this.addToParent(mapUniqueKey, operate.move.sourceParentMapUniqueKey, operate.move.sourceIndex);
                    break;
                case 'remove':
                    this.addComplexComponent(operate.remove.parentMapUniqueKey, operate.mapUniqueKey, operate.remove.index, operate.remove);
                    break;
                case 'paste':
                    this.deleteComponent(operate.mapUniqueKey);
                    break;
                case 'reset':
                    this.components.get(operate.mapUniqueKey).props = operate.reset.beforeProps;
                    break;
                case 'addCombo':
                    this.deleteComponent(operate.mapUniqueKey);
                    break;
                case 'addSource':
                    this.deleteComponent(operate.mapUniqueKey);
                    break;
            }
            this.nowOperateIndex -= 1;
        }
    }, {
        key: "redo",
        value: function redo() {
            if (this.nowOperateIndex >= this.operates.length - 1) {
                return;
            }
            this.cancelEditComponent();
            this.nowOperateIndex += 1;
            var operate = this.operates[this.nowOperateIndex];
            switch (operate.type) {
                case 'add':
                    this.addNewComponent(operate.mapUniqueKey, operate.add.parentMapUniqueKey, operate.add.uniqueId, operate.add.index);
                    break;
                case 'update':
                    this.components.get(operate.mapUniqueKey).props = mobx_1.extendObservable({}, _.cloneDeep(operate.update.newValue));
                    break;
                case 'exchange':
                    this.sortComponents(operate.mapUniqueKey, operate.exchange.oldIndex, operate.exchange.newIndex);
                    break;
                case 'move':
                    var mapUniqueKey = this.components.get(operate.move.sourceParentMapUniqueKey).layoutChilds.splice(operate.move.sourceIndex, 1)[0];
                    this.addToParent(mapUniqueKey, operate.move.targetParentMapUniqueKey, operate.move.targetIndex);
                    break;
                case 'remove':
                    this.deleteComponent(operate.mapUniqueKey);
                    break;
                case 'paste':
                    this.addComplexComponent(operate.paste.parentMapUniqueKey, operate.mapUniqueKey, operate.paste.index, operate.paste);
                    break;
                case 'reset':
                    var ComponentClass = this.application.getComponentByUniqueKey(operate.reset.beforeProps.gaeaUniqueKey);
                    this.components.get(operate.mapUniqueKey).props = mobx_1.extendObservable({}, _.cloneDeep(ComponentClass.defaultProps));
                    break;
                case 'addCombo':
                    this.addComplexComponent(operate.addCombo.parentMapUniqueKey, operate.mapUniqueKey, operate.addCombo.index, operate.addCombo.componentInfo);
                    break;
                case 'addSource':
                    this.addComplexComponent(operate.addSource.parentMapUniqueKey, operate.mapUniqueKey, operate.addSource.index, operate.addSource.componentInfo);
                    break;
            }
        }
    }, {
        key: "setDragTarget",
        value: function setDragTarget(mapUniqueKey, index) {
            this.dragTargetMapUniqueKey = mapUniqueKey;
            this.dragTargetIndex = index;
        }
    }, {
        key: "setHoveringComponentMapUniqueKey",
        value: function setHoveringComponentMapUniqueKey(mapUniqueKey) {
            this.hoveringComponentMapUniqueKey = mapUniqueKey;
        }
    }, {
        key: "copy",
        value: function copy(mapUniqueKey) {
            if (!mapUniqueKey) {
                return true;
            }
            this.copyComponent = this.getComponentFullInfoByMapUniqueKey(mapUniqueKey);
        }
    }, {
        key: "createCopyComponentWithNewUniqueKey",
        value: function createCopyComponentWithNewUniqueKey(originComponent, parentMapUniqueKey) {
            var _this6 = this;

            var uniqueKeyMap = new Map();
            uniqueKeyMap.set(originComponent.mapUniqueKey, this.createUniqueId());
            if (originComponent.componentInfo.props.gaeaUniqueKey === 'gaea-layout') {
                Object.keys(originComponent.childs).forEach(function (childMapUniqueKey) {
                    uniqueKeyMap.set(childMapUniqueKey, _this6.createUniqueId());
                });
            }
            var childs = {};
            Object.keys(originComponent.childs).forEach(function (mapUniqueKey) {
                var originChild = originComponent.childs[mapUniqueKey];
                childs[uniqueKeyMap.get(mapUniqueKey)] = {
                    parentMapUniqueKey: uniqueKeyMap.get(originChild.parentMapUniqueKey),
                    props: JSON.parse(JSON.stringify(originChild.props))
                };
                if (originChild.layoutChilds) {
                    childs[uniqueKeyMap.get(mapUniqueKey)].layoutChilds = originChild.layoutChilds.map(function (childMapUniqueKey) {
                        return uniqueKeyMap.get(childMapUniqueKey);
                    });
                }
            });
            var newCopyComponent = {
                mapUniqueKey: uniqueKeyMap.get(originComponent.mapUniqueKey),
                componentInfo: {
                    parentMapUniqueKey: parentMapUniqueKey,
                    props: JSON.parse(JSON.stringify(originComponent.componentInfo.props))
                },
                childs: childs
            };
            if (originComponent.componentInfo.layoutChilds) {
                newCopyComponent.componentInfo.layoutChilds = originComponent.componentInfo.layoutChilds.map(function (childMapUniqueKey) {
                    return uniqueKeyMap.get(childMapUniqueKey);
                });
            }
            return newCopyComponent;
        }
    }, {
        key: "paste",
        value: function paste(parentMapUniqueKey) {
            if (!parentMapUniqueKey) {
                return true;
            }
            if (!this.copyComponent) {
                return true;
            }
            var parentComponent = this.components.get(parentMapUniqueKey);
            if (parentComponent.props.gaeaUniqueKey !== 'gaea-layout') {
                return false;
            }
            var newCopyComponent = this.createCopyComponentWithNewUniqueKey(this.copyComponent, parentMapUniqueKey);
            var parentChildCount = this.components.get(parentMapUniqueKey).layoutChilds.length;
            this.addComplexComponent(parentMapUniqueKey, newCopyComponent.mapUniqueKey, parentChildCount, newCopyComponent);
            this.saveOperate({
                type: 'paste',
                mapUniqueKey: newCopyComponent.mapUniqueKey,
                paste: {
                    parentMapUniqueKey: parentMapUniqueKey,
                    index: parentChildCount,
                    mapUniqueKey: newCopyComponent.mapUniqueKey,
                    componentInfo: newCopyComponent.componentInfo,
                    childs: newCopyComponent.childs
                }
            });
            return true;
        }
    }, {
        key: "getComponentFullInfoByMapUniqueKey",
        value: function getComponentFullInfoByMapUniqueKey(mapUniqueKey) {
            var _this7 = this;

            var componentInfo = this.components.get(mapUniqueKey);
            var childs = {};
            var mapChilds = function mapChilds(component, childs) {
                if (component.props.gaeaUniqueKey === 'gaea-layout' && component.layoutChilds) {
                    JSON.parse(JSON.stringify(component.layoutChilds)).forEach(function (componentMapUniqueKey) {
                        var childInfo = _this7.components.get(componentMapUniqueKey);
                        childs[componentMapUniqueKey] = JSON.parse(JSON.stringify(childInfo));
                        mapChilds(childInfo, childs);
                    });
                }
            };
            mapChilds(componentInfo, childs);
            return {
                mapUniqueKey: mapUniqueKey,
                componentInfo: JSON.parse(JSON.stringify(componentInfo)),
                childs: childs
            };
        }
    }, {
        key: "showSidebarAddon",
        value: function showSidebarAddon() {
            var _this8 = this;

            this.isShowSidebarAddon = true;
            setTimeout(function () {
                _this8.resetComponentOutline();
            }, 210);
        }
    }, {
        key: "hideSidebarAddon",
        value: function hideSidebarAddon() {
            var _this9 = this;

            this.isShowSidebarAddon = false;
            setTimeout(function () {
                _this9.resetComponentOutline();
            }, 210);
        }
    }, {
        key: "showLeftBar",
        value: function showLeftBar(leftBarType) {
            this.leftBarType = leftBarType;
            this.isShowLeftBar = true;
        }
    }, {
        key: "hideLeftBar",
        value: function hideLeftBar() {
            this.leftBarType = '';
            this.isShowLeftBar = false;
        }
    }, {
        key: "setShowEditorPanelShadow",
        value: function setShowEditorPanelShadow(show) {
            this.showEditorPanelShadow = show;
            if (!show) {
                this.application.event.emit(this.application.event.editorPanelShadowClose);
            }
        }
    }, {
        key: "canUndo",
        get: function get() {
            return this.nowOperateIndex > -1;
        }
    }, {
        key: "canRedo",
        get: function get() {
            return this.nowOperateIndex < this.operates.length - 1;
        }
    }]);

    return Viewport;
}();

__decorate([mobx_1.observable], Viewport.prototype, "components", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "rootMapUniqueKey", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "isMovingComponent", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "showLayoutBorder", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "viewportHoverComponentSpec", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "treeHoverComponentSpec", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "currentEditComponentMapUniqueKey", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "nowOperateIndex", void 0);
__decorate([mobx_1.computed], Viewport.prototype, "canUndo", null);
__decorate([mobx_1.computed], Viewport.prototype, "canRedo", null);
__decorate([mobx_1.observable], Viewport.prototype, "isShowSidebarAddon", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "isShowLeftBar", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "leftBarType", void 0);
__decorate([mobx_1.observable], Viewport.prototype, "showEditorPanelShadow", void 0);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Viewport;