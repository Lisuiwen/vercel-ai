# Provider 架构

AI SDK 采用分层 provider 架构，遵循适配器模式，通过统一接口支持多种 AI provider。

## 架构概览

```mermaid
graph LR
    AI["Main Package<br/>ai"] --> PROVIDER["Specifications<br/>@ai-sdk/provider"]
    AI --> UTILS["Shared Utilities<br/>@ai-sdk/provider-utils"]
    UTILS --> PROVIDER
    OPENAI["Provider<br/>e.g. @ai-sdk/openai"] --> PROVIDER
    OPENAI --> UTILS
    OPENAI --> OPENAI_API["Provider API<br/>e.g. OpenAI API<br/>(External)"]

    classDef core fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef spec fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef utils fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef provider fill:#fff8e1,stroke:#ff6f00,stroke-width:2px
    classDef external fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class AI core
    class PROVIDER spec
    class UTILS utils
    class OPENAI provider
    class OPENAI_API external
```

更深入的说明见 [provider abstraction architecture doc](../architecture/provider-abstraction.md)。
