---
title: 踩坑：默认存储被 TF 卡遮蔽
summary: 真机 tree 探针发现一台设备有多个平级存储卷，初版把 TF 卡当默认存储，所有观测都被悄悄带偏——「可见 ≠ 可读」也是这一轮才真正立住
status: published
visibility: public
published_at: 2026-11-21
tags: [phonefiles, build-log, mtp, pitfall]
kind: build-log
product_id: phonefiles
locale: zh-CN
---

## 一台设备，两个平级存储卷

真机 tree 探针在 Redmi 10X Pro 上发现多个平级存储卷：disk 卷被 WPD 上报为 `REMOVABLE_RAM(4)`，映射到 `sdcard1`——用户确认这其实是 TF 卡；而「内部存储设备」卷是 `FIXED_RAM(3)`，映射到 `internal_shared`，才是真正的默认存储。两卷有相同的 functionalCategory 和 64–256GB 容量桶，靠显示名根本分不清。

## 被"看起来正常"骗过

初版探针把 root 下的目录当候选起点、返回第一个匹配，disk 卷排在最前，结果所有观测都来自 TF 卡，默认存储被完全遮蔽。两卷都有 `Download`、`Recordings`、`Android/data` 这些同名目录，输出看起来「正常」得让人放松警惕；硬编码 `root:"internal_shared"` 更是把 TF 卡的观测错标成默认存储。文档里把这一条标为「已实际踩中并修正」。

## 八项修正

- 改为每卷单独 `FindWithinVolumeAsync`，不跨卷匹配；
- root 由 `WPD_STORAGE_TYPE` 保守映射，不靠显示名猜；
- schema 新增可选 `volume` 对象；
- 伪扩展名 `.removed-20240201-192827` 会泄漏文件名片段，`NormalizeExtension` 收紧为仅 `[a-z0-9]`、2–8 字符。

## 可见 ≠ 可读

默认存储下 `Android/data/com.tencent.mm/MicroMsg` 目录可见，但扩展名分布为空、`sizeBucket=0`；Android 17 的 GT7 Pro 上 MicroMsg 仍可见，却是 `ext={tmp:1.00}`、`size=0`。这修正了 v1.0「Android 11+ 该目录对 MTP 普遍不可见」的绝对化假设——**可见和可读是两件事**。

## 诚实边界

样本仅 3 台（Redmi 10X Pro 双卷 / Redmi Note 7 Pro / GT7 Pro），远未达 20–30 台目标，结论只是机制性发现，不能外推成可达率。Redmi Note 7 Pro 的 `getprop release=16/sdk=36` 与 fingerprint 指向 Android 10 矛盾——记录多源，不做外推。
