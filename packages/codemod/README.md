# AI SDK Codemod

AI SDK 提供自动化代码转换（codemod），在版本间功能弃用、移除或变更时帮助升级代码库。

Codemod 以编程方式在代码库上运行转换，无需逐文件手动修改即可批量应用变更。

## 快速开始

### 运行全部 Codemod（推荐）

运行全部 codemod：

```sh
npx @ai-sdk/codemod upgrade
```

将自动检测并转换项目中所有适用的代码模式。

### 运行指定版本的 Codemod

运行指定版本的 codemod：

```sh
npx @ai-sdk/codemod v4

npx @ai-sdk/codemod v5

npx @ai-sdk/codemod v6

npx @ai-sdk/codemod upgrade
```

### 运行单个 Codemod

运行单个 codemod：

```sh
npx @ai-sdk/codemod <codemod-name> <path>
```

示例：

```sh
# Transform a specific file
npx @ai-sdk/codemod v4/remove-experimental-ai-fn-exports src/app/api/chat/route.ts

# Transform a directory
npx @ai-sdk/codemod v4/replace-baseurl src/lib/

# Transform entire project
npx @ai-sdk/codemod v5/rename-format-stream-part .
```

## 可用 Codemod

### v4 Codemod（v3 → v4 迁移）

| Codemod | 说明 |
| --- | --- |
| `v4/remove-ai-stream-methods-from-stream-text-result` | 转换 v4/remove ai stream methods from stream text result |
| `v4/remove-anthropic-facade`                          | Transforms v4/remove anthropic facade                          |
| `v4/remove-await-streamobject`                        | Transforms v4/remove await streamobject                        |
| `v4/remove-await-streamtext`                          | Transforms v4/remove await streamtext                          |
| `v4/remove-deprecated-provider-registry-exports`      | Transforms v4/remove deprecated provider registry exports      |
| `v4/remove-experimental-ai-fn-exports`                | Transforms v4/remove experimental ai fn exports                |
| `v4/remove-experimental-message-types`                | Transforms v4/remove experimental message types                |
| `v4/remove-experimental-streamdata`                   | Transforms v4/remove experimental streamdata                   |
| `v4/remove-experimental-tool`                         | Transforms v4/remove experimental tool                         |
| `v4/remove-experimental-useassistant`                 | Transforms v4/remove experimental useassistant                 |
| `v4/remove-google-facade`                             | Transforms v4/remove google facade                             |
| `v4/remove-isxxxerror`                                | Transforms v4/remove isxxxerror                                |
| `v4/remove-metadata-with-headers`                     | Transforms v4/remove metadata with headers                     |
| `v4/remove-mistral-facade`                            | Transforms v4/remove mistral facade                            |
| `v4/remove-openai-facade`                             | Transforms v4/remove openai facade                             |
| `v4/rename-format-stream-part`                        | Transforms v4/rename format stream part                        |
| `v4/rename-parse-stream-part`                         | Transforms v4/rename parse stream part                         |
| `v4/replace-baseurl`                                  | Transforms v4/replace baseurl                                  |
| `v4/replace-continuation-steps`                       | Transforms v4/replace continuation steps                       |
| `v4/replace-langchain-toaistream`                     | Transforms v4/replace langchain toaistream                     |
| `v4/replace-nanoid`                                   | Transforms v4/replace nanoid                                   |
| `v4/replace-roundtrips-with-maxsteps`                 | Transforms v4/replace roundtrips with maxsteps                 |
| `v4/replace-token-usage-types`                        | Transforms v4/replace token usage types                        |
| `v4/rewrite-framework-imports`                        | Transforms v4/rewrite framework imports                        |

### v5 Codemod（v4 → v5 迁移）

| Codemod                                                               | Description                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `v5/flatten-streamtext-file-properties`                               | 转换 v5/flatten streamtext file properties                               |
| `v5/import-LanguageModelV2-from-provider-package`                     | Transforms v5/import LanguageModelV2 from provider package                     |
| `v5/migrate-to-data-stream-protocol-v2`                               | Transforms v5/migrate to data stream protocol v2                               |
| `v5/move-image-model-maxImagesPerCall`                                | Transforms v5/move image model maxImagesPerCall                                |
| `v5/move-langchain-adapter`                                           | Transforms v5/move langchain adapter                                           |
| `v5/move-maxsteps-to-stopwhen`                                        | Transforms v5/move maxsteps to stopwhen                                        |
| `v5/move-provider-options`                                            | Transforms v5/move provider options                                            |
| `v5/move-react-to-ai-sdk`                                             | Transforms v5/move react to ai sdk                                             |
| `v5/move-ui-utils-to-ai`                                              | Transforms v5/move ui utils to ai                                              |
| `v5/remove-experimental-wrap-language-model`                          | Transforms v5/remove experimental wrap language model                          |
| `v5/remove-get-ui-text`                                               | Transforms v5/remove get ui text                                               |
| `v5/remove-openai-compatibility`                                      | Transforms v5/remove openai compatibility                                      |
| `v5/remove-sendExtraMessageFields`                                    | Transforms v5/remove sendExtraMessageFields                                    |
| `v5/rename-IDGenerator-to-IdGenerator`                                | Transforms v5/rename IDGenerator to IdGenerator                                |
| `v5/rename-addtoolresult-to-addtooloutput`                            | Transforms v5/rename addtoolresult to addtooloutput                            |
| `v5/rename-converttocoremessages-to-converttomodelmessages`           | Transforms v5/rename converttocoremessages to converttomodelmessages           |
| `v5/rename-core-message-to-model-message`                             | Transforms v5/rename core message to model message                             |
| `v5/rename-datastream-methods-to-uimessage`                           | Transforms v5/rename datastream methods to uimessage                           |
| `v5/rename-datastream-transform-stream`                               | Transforms v5/rename datastream transform stream                               |
| `v5/rename-languagemodelv1providermetadata`                           | Transforms v5/rename languagemodelv1providermetadata                           |
| `v5/rename-max-tokens-to-max-output-tokens`                           | Transforms v5/rename max tokens to max output tokens                           |
| `v5/rename-message-to-ui-message`                                     | Transforms v5/rename message to ui message                                     |
| `v5/rename-mime-type-to-media-type`                                   | Transforms v5/rename mime type to media type                                   |
| `v5/rename-pipedatastreamtoresponse-to-pipeuimessagestreamtoresponse` | Transforms v5/rename pipedatastreamtoresponse to pipeuimessagestreamtoresponse |
| `v5/rename-reasoning-properties`                                      | Transforms v5/rename reasoning properties                                      |
| `v5/rename-reasoning-to-reasoningText`                                | Transforms v5/rename reasoning to reasoningText                                |
| `v5/rename-request-options`                                           | Transforms v5/rename request options                                           |
| `v5/rename-todatastreamresponse-to-touimessagestreamresponse`         | Transforms v5/rename todatastreamresponse to touimessagestreamresponse         |
| `v5/rename-tool-parameters-to-inputschema`                            | Transforms v5/rename tool parameters to inputschema                            |
| `v5/replace-bedrock-snake-case`                                       | Transforms v5/replace bedrock snake case                                       |
| `v5/replace-content-with-parts`                                       | Transforms v5/replace content with parts                                       |
| `v5/replace-datastream-to-uimessagestream`                            | Transforms v5/replace datastream to uimessagestream                            |
| `v5/replace-experimental-provider-metadata`                           | Transforms v5/replace experimental provider metadata                           |
| `v5/replace-fal-snake-case`                                           | Transforms v5/replace fal snake case                                           |
| `v5/replace-image-type-with-file-type`                                | Transforms v5/replace image type with file type                                |
| `v5/replace-llamaindex-adapter`                                       | Transforms v5/replace llamaindex adapter                                       |
| `v5/replace-oncompletion-with-onfinal`                                | Transforms v5/replace oncompletion with onfinal                                |
| `v5/replace-provider-metadata-with-provider-options`                  | Transforms v5/replace provider metadata with provider options                  |
| `v5/replace-rawresponse-with-response`                                | Transforms v5/replace rawresponse with response                                |
| `v5/replace-redacted-reasoning-type`                                  | Transforms v5/replace redacted reasoning type                                  |
| `v5/replace-simulate-streaming`                                       | Transforms v5/replace simulate streaming                                       |
| `v5/replace-textdelta-with-text`                                      | Transforms v5/replace textdelta with text                                      |
| `v5/replace-usage-token-properties`                                   | Transforms v5/replace usage token properties                                   |
| `v5/replace-usechat-api-with-transport`                               | Transforms v5/replace usechat api with transport                               |
| `v5/replace-usechat-input-with-state`                                 | Transforms v5/replace usechat input with state                                 |
| `v5/replace-zod-import-with-v3`                                       | Transforms v5/replace zod import with v3                                       |
| `v5/require-createIdGenerator-size-argument`                          | Transforms v5/require createIdGenerator size argument                          |
| `v5/restructure-file-stream-parts`                                    | Transforms v5/restructure file stream parts                                    |
| `v5/restructure-source-stream-parts`                                  | Transforms v5/restructure source stream parts                                  |
| `v5/rsc-package`                                                      | Transforms v5/rsc package                                                      |

### v6 Codemod（v5 → v6 迁移）

| Codemod                                                     | Description                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `v6/add-await-converttomodelmessages`                       | 转换 v6/add await converttomodelmessages                       |
| `v6/rename-converttocoremessages-to-converttomodelmessages` | Transforms v6/rename converttocoremessages to converttomodelmessages |
| `v6/rename-core-message-to-model-message`                   | Transforms v6/rename core message to model message                   |
| `v6/rename-mock-v2-to-v3`                                   | Transforms v6/rename mock v2 to v3                                   |
| `v6/rename-text-embedding-to-embedding`                     | Transforms v6/rename text embedding to embedding                     |
| `v6/rename-tool-call-options-to-tool-execution-options`     | Transforms v6/rename tool call options to tool execution options     |
| `v6/rename-vertex-provider-metadata-key`                    | Transforms v6/rename vertex provider metadata key                    |
| `v6/wrap-tomodeloutput-parameter`                           | Transforms v6/wrap tomodeloutput parameter                           |

## CLI 选项

### 命令

```sh
npx @ai-sdk/codemod@beta <command> [options]
```

**可用命令：**

- `upgrade` - 应用全部 codemod（v4 + v5 + v6）
- `v4` - 应用 v4 codemod（v3 → v4 迁移）
- `v5` - 应用 v5 codemod（v4 → v5 迁移）
- `v6` - 应用 v6 codemod（v5 → v6 迁移）
- `<codemod-name> <path>` - 应用指定 codemod

### 全局选项

- `--dry` - 预览变更而不写入
- `--print` - 将转换后的代码打印到 stdout
- `--verbose` - 显示详细转换日志

### 示例

```sh
# Preview all changes without applying
npx @ai-sdk/codemod@beta --dry upgrade

# Preview v4 changes only
npx @ai-sdk/codemod@beta --dry v4

# Preview v5 changes only
npx @ai-sdk/codemod@beta --dry v5

# Preview v6 changes only
npx @ai-sdk/codemod@beta --dry v6

# Show verbose output for specific codemod
npx @ai-sdk/codemod@beta --verbose v4/remove-experimental-ai-fn-exports src/

# Print transformed code for specific codemod
npx @ai-sdk/codemod@beta --print v4/replace-baseurl src/config.ts
```

## 最佳实践

### 运行 Codemod 之前

1. **备份代码** - 将全部变更提交到版本控制
2. **查看当前弃用警告** - 先修复明显问题
3. **更新依赖** - 确保已升级到目标 AI SDK 版本

### 运行 Codemod 之后

1. **审查变更** - 查看 diff 了解转换内容
2. **测试应用** - 确认一切按预期工作
3. **处理边界情况** - 部分复杂模式可能需手动修复
4. **运行类型检查** - 修复剩余 TypeScript 错误

### 故障排除

若某段代码未被 codemod 转换：

1. **检查文件扩展名** - Codemod 适用于 `.ts`、`.tsx`、`.js`、`.jsx`
2. **检查模式** - 复杂或非典型代码可能需手动更新
3. **运行指定 codemod** - 可单独运行以针对性修复
4. **查阅文档** - 部分变更可能没有自动化 codemod

## 贡献

### 添加新 Codemod

1. 在 `src/codemods/` 中创建 codemod
2. 在 `src/test/__testfixtures__/` 添加测试 fixture
3. 在 `src/test/` 中编写测试
4. 更新 `src/lib/upgrade.ts` 中的 bundle

### 测试 Codemod

首先进入 codemod 目录：

```sh
cd packages/codemod
```

然后运行测试：

```sh
# Run all tests
pnpm test

# Run specific codemod tests
pnpm test <codemod-name>

# Test in development
pnpm test:watch
```

## 支持

- **文档**：[AI SDK 迁移指南](https://ai-sdk.dev/docs/migration-guides)
- **Issue**：[GitHub Issues](https://github.com/vercel/ai/issues)
- **社区**：[Discord](https://discord.gg/vercel)

## 版本兼容性

- **AI SDK 6.0**：本包中的全部 codemod
- **AI SDK 5.0**：使用 v4 + v5 codemod
- **AI SDK 4.x**：使用 `@ai-sdk/codemod@1.x`
- **AI SDK 3.x**：需手动迁移

---

更详细的迁移信息见：

- [AI SDK 6.0 迁移指南](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0)
