---
title: License 一票否决：换掉 pyannote
summary: 技术选型立下「License 一票否决」硬原则——Gated 权重不能随商业安装包分发，faster-whisper 因打包 Python 运行时降为可选，主引擎改走 sherpa-onnx
status: published
visibility: public
published_at: 2026-11-21
tags: [locrecord, decision, license, asr]
kind: decision
product_id: locrecord
locale: zh-CN
---

## T1：License 一票否决

技术选型立下 T1 原则：**任何 AGPL/GPL/传染性/Gated 组件不得进入随包分发的闭源产品**，并明确「先用了再说 = 未来下架风险」。对一款要闭源商用的桌面工具，这不是洁癖，是提前拆掉定时炸弹。

## pyannote 被一票否决

复核发现 `pyannote/speaker-diarization-3.1` 与 `segmentation-3.0` 在 Hugging Face 是 **Gated**；后者 README 虽称「uses MIT license and will always remain open-source」，但门禁与独立条款仍在，判定**不能随商业安装包分发**。社区里「绕过门禁」的做法被明确否决——合规不能靠绕。

## faster-whisper 降级

上游设想的 faster-whisper 被实测证伪其适配性：它是 Python 库，直嵌 Tauri 需打包 Python 运行时 + CTranslate2，安装包增约 **80–150 MB**，跨进程 IPC 也复杂。于是降为按需下载的可选 sidecar，MVP 主引擎改为 Rust 可原生集成的 `sherpa-onnx`（Apache-2.0）。

## 落地成 trait 与幻觉治理

决策落成 Rust trait `AsrEngine { fn transcribe(&self, pcm:&Pcm, opts:&AsrOpts) -> Result<Vec<Utterance>> }`，并强制幻觉治理：`vad_filter=True` 类静音过滤（阻断幻听「Thank you for watching!」）+ `condition_on_previous_text=False`（避免错误累积）。

## 取舍

全栈由绿灯组件构成：无 AGPL/GPL 传染、无 Gated 权重随包。相对上游的两处修正（避 pyannote、faster-whisper 降级）没有改变产品定位，只把「能闭源商用」这一硬约束提前满足。**先把不能做的事排除掉，能做的事才稳。**
