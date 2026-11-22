---
title: sherpa 静态链接踩坑：从 No-Go 到 DLL 路径修复
summary: 隔离探针实测静态链接 MSVC 预编译库是死路，改动态链接后又被 DLL 加载路径卡住——两个坑连着踩，才换来 1 秒内启动的安装包
status: published
visibility: public
published_at: 2026-11-22
tags: [locrecord, build-log, rust, tauri, pitfall]
kind: build-log
product_id: locrecord
locale: zh-CN
---

## 静态链接：No-Go

`sherpa-onnx` Rust crate v2.0.2 的 `build.rs` 不编译 C++，而是从 GitHub 下载官方预编译库，Windows 版**只有 MSVC/MT 格式**；而本机 Rust target 只有 `x86_64-pc-windows-gnu`，没有 MSVC 工具链。

隔离探针实测：static 静态链接 = No-Go。GNU ld 链接 MSVC 静态库报大量未定义符号——`__GSHandlerCheck_EH4`、`__std_terminate`、`__CxxFrameHandler4`、`__GSHandlerCheck`，以及 `??1?$basic_string@...`、`??1?$shared_ptr@...` 这类 MSVC 名字修饰（来自 onnxruntime），MinGW 的 libstdc++ 根本无法解析。

## 动态链接：Go

改成 `sherpa-onnx = { version = "2.0.2", default-features = false, features = ["shared"] }`。预编译包 7.8 MB，含 4 个 DLL（onnxruntime.dll / sherpa-onnx-c-api.dll / sherpa-onnx-cxx-api.dll / onnxruntime_providers_shared.dll）+ 3 个导入库，`cargo build` exit=0（12.92s）。4 个 DLL 约 22 MB，仍远低于 NFR-05 的 120 MB 上限。

## 出包又踩一坑

`tauri.conf.json` 的 `bundle.resources` 原用**数组格式**，Tauri 2 会保留原始目录结构，把 4 个 DLL 打进 `_up_\vendor\sherpa-onnx\lib\` 子目录。Windows 加载器只在 exe 同级找 DLL，全新安装启动即弹「由于找不到 sherpa-onnx-c-api.dll，无法继续执行代码」。

改为 map 格式——`"../vendor/sherpa-onnx/lib/xxx.dll": "xxx.dll"`（依据 tauri-utils config.rs:1631-1643）——4 个 DLL 落到安装根目录，全新安装 1 秒内启动。

## 体积账本

M1 安装包 5.05 MiB → M2 出包 10.69 MiB（+5.6 MB，即 sherpa 4 DLL 压缩后体积），仍远低于 120 MB 上限。**链接方式、打包格式、体积预算是同一道题的三面。**
