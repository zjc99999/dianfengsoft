---
title: 贡献的不是路径，是脱敏观测
summary: v1.1 把社区最小贡献单元从「机型→唯一路径表」改为「脱敏真机观测 Observation」——规则是派生品而不是手工真相
status: published
visibility: public
published_at: 2026-11-21
tags: [phonefiles, decision, governance, privacy]
kind: decision
product_id: phonefiles
locale: zh-CN
---

## 为什么推翻"路径表"

MTP 不提供字符串路径，机型 × ROM × 系统 × App 版本的组合会爆炸；微信的 `MicroMsg/<32位账号hash>` 根本不能硬编码；真正决定能不能归档的是「可见性」而非路径。更关键的是代价不对称——一条错误标签会导致误删，且不可逆。所以 v1.1 把社区最小贡献单元从「机型→唯一路径表」改成「脱敏真机观测 Observation」，原则一句话：**贡献观测，不贡献路径**。

## Observation 怎么设计

- `exists:false` / `canEnumerate:false` 是一等公民——记录「看不见」比提交十条假想路径更有价值；
- `channel`（mtp / adb）必须入模；
- fingerprint 只含目录名与扩展名分布，绝不含文件名、内容或账号 hash 原文；
- 脱敏红线：禁止 IMEI、序列号，MicroMsg 的 hash 段只保留到 `MicroMsg/`。

## 规则是派生品，不是手工真相

治理流水线：提交 → 自动校验 → 待复核 → 2 名 trusted contributor 确认 → canary 灰度 5% → 观察 7 天无异常 → stable 全量 → 版本化 + 签名下发 → 客户端内置 baseline 兜底。2 人 review 必须是不同贡献者，作者不得自审。

置信度模型 `confidence = f(独立观测数, 设备多样性, 时间新鲜度)`，按季度衰减，低于 0.6 自动降级 `pending_review`；冲突时多候选全部保留、按置信度排序。目标：冲突率 < 5%、规则失效率 < 10%/季度、baseline 目录→标签覆盖率 ≥ 60%。

## 三条命令完成采样

`list → observe --from-adb → validate_observation.py`。观察目标写在 `config/observe-config.json`，加一行 `nodePattern` 就能采样新目录，无需改 C# 或重编译。校验器会检查 `filenameSamples=false`、伪扩展名、疑似 15–17 位 IMEI、`nodePattern` 禁盘符/hash/文件名，并扫描与配置的一致性。

## 取舍

把「贡献什么」从路径改成观测，表面是数据结构变更，实质是把社区协作的信任成本压到可治理的范围——**能验证的才采信，不能验证的只作参考**。
