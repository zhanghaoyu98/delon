---
order: 1001
title: 2.x升级指引
type: Other
---

## 写在前面

v2 的主要升级是 `@delon/*` 系列组件，以中后台最基础操作重新定义组件。

## 约定

- 除组件名、指令名以后，所有属性、数据定义都采用驼峰式命令规则

## 类库变更

| 原所在库 | 新库 | 描述 |
| ------ | ---- | --- |
| `abc` | `chart` | G2 图表 |

## 组件变更

### 规则

- 所有组件名增加 `na-` 前缀，属性名依然保持不变。

### 组件名变更细节

| 原组件名 | 新组件名 | 描述 |
| ------ | ------ | ---- |
| `simple-table` | `na-table` | - |

### 组件属性名变更

| 所属组件 | 原属性名 | 新属性名 | 描述 |
| ------ | ------ | ---- | --- |
| `na-page-header` | `home_link` | `homeLink` | - |
| `na-page-header` | `home_i18n` | `homeI18n` | - |
| `na-table` | `extraParams` | `req.params` | - |
| `na-table` | `reqMethod` | `req.method` | - |
| `na-table` | `reqHeader` | `req.header` | - |
| `na-table` | `reqBody` | `req.body` | - |

## API变更

| 类库 | 组件 | 原 | 新 | 支持 ng update | 描述 |
| --- | ---- | -- | -- | -- | -- |


// | chart | All | `g2-` | `na-` | √ | - |
