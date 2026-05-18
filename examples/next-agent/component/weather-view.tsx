import type { WeatherUIToolInvocation } from '@/tool/weather-tool';

export default function WeatherView({
  invocation,
}: {
  invocation: WeatherUIToolInvocation;
}) {
  switch (invocation.state) {
    // 流式 tool 调用预渲染示例：
    case 'input-streaming':
      return <pre>{JSON.stringify(invocation.input, null, 2)}</pre>;
    case 'input-available':
      return (
        <div className="text-gray-500">
          Getting weather information for {invocation.input.city}...
        </div>
      );
    case 'output-available':
      return (
        <div className="text-gray-500">
          {invocation.output.state === 'loading'
            ? 'Fetching weather information...'
            : `Weather in ${invocation.input.city}: ${invocation.output.weather}`}
        </div>
      );
    case 'output-error':
      return <div className="text-red-500">Error: {invocation.errorText}</div>;
  }
}
