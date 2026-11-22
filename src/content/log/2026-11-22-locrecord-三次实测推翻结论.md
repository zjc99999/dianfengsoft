---
title: 三次实测推翻结论：Whisper 中文反转
summary: 同一段音频同一份答案，faster-whisper 把字错率从 20.94% 打到 8.13%，一度以为找到了替代品——直到用应用真实集成再测，69.64% 把结论彻底推翻
status: published
visibility: public
published_at: 2026-11-22
tags: [locrecord, retro, asr, testing]
kind: retro
product_id: locrecord
locale: zh-CN
---

## 同一段音频，同一份答案

用同一段音频（`merged_first6min.wav`，360s / 44.1kHz / 16bit 单声道 / 30.28MB）和同一份 GT（36 行 / 18 段精修稿）做字错率（CER）对照。SenseVoice int8 基线：**20.94%**（gt 1538 / hyp 1501 / 编辑距离 322）。这个数字是应用当前主引擎的真实水平。

## 第一轮：看起来赢了

faster-whisper-small（CT2 格式 `model.bin` 461MB，faster-whisper 1.2.1 + ctranslate2 4.9.0，CPU int8，`language="zh"`、`beam_size=5`、`vad_filter=True`）CER **8.13%**——绝对下降约 12.8 个百分点、相对下降约 61%；耗时 77.6s/360s（RTF=0.216），模型加载 0.7s，「政则/在玉兰/评证」这些同音错字大幅减少。据此一度得出「Whisper 可替代 SenseVoice」的结论。

## 第二轮：被应用内实测推翻

用应用真实的 `SherpaEngine::load()` + `transcribe()`（sherpa-onnx 2.0.2 Rust 绑定）加载 `csukuangfj/sherpa-onnx-whisper-small` int8 ONNX，同一口径 CER 竟为 **69.64%**（126.95s / 12 段 / 4559 字符），输出出现明显幻觉与重复（「五五五五…」「最深 最深…」）。

根因线索：绑定默认 `max_tokens_per_second=6` 触发 token 上限截断告警，而 **sherpa-onnx 2.0.2 Rust 绑定未暴露该解码参数**，应用侧无法调整。

## 修正后的结论

此前「Whisper 精度够用」只对 faster-whisper/CTranslate2 运行时成立，**不适用于应用当前集成的 sherpa-onnx Whisper ONNX**。中文高精度场景，当前更稳妥的是 SenseVoice（履行 FunASR v1.1 署名义务）；商用合规优先可选 MIT Whisper，但必须自行在应用内实测。报告明确标注「工程实测，非法律意见」，并纠正了 v0.1.0「未做应用内实测」的表述。

## 取舍

基准测试用哪个运行时，结论就属于哪个运行时。**跨运行时的数字不能直接搬**——这一课让「应用内实测」成为硬门禁，而不是可选项。
