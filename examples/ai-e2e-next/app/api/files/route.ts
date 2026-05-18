import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

/*
 * 此路由用于将文件上传到 Vercel Blob Storage。
 * 示例来自 https://vercel.com/docs/storage/vercel-blob/client-upload#create-a-client-upload-route
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        /* clientPayload */
      ) => {
        // 生成供浏览器上传文件的客户端 token
        // ⚠️ 在生成 token 之前请对用户进行认证与授权。
        // 否则将允许匿名上传。

        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
          ],
          tokenPayload: JSON.stringify({
            // 可选，上传完成时发送到你的服务器
            // 可传入来自 auth 的 user id，或来自 clientPayload 的值
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 在客户端上传完成时收到通知
        // ⚠️ 这在 `localhost` 网站上无法工作，
        // 使用 ngrok 或类似工具以完成完整上传流程

        console.log('file upload completed', blob, tokenPayload);

        try {
          // 文件上传完成后运行任意逻辑
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          throw new Error('Could not complete operation');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // Webhook 将重试 5 次，等待 200 响应
    );
  }
}
