import { Context, h, Schema, Session } from "koishi";
import { pathToFileURL } from "url";

export const inject = ["http"]

export const usage =
  `
<h2>请先部署 <a href="https://github.com/LingLambda/JMComic-Api">JMComic-Api</a></h2>

<p>使用： jmid 422866 获取422866编号的jm漫画</p>
`
export interface Config {
  baseUrl: string;
  isPath: boolean;
  loginfo: boolean;
}

export const Config: Schema<Config> = Schema.object({
  baseUrl: Schema.string()
    .description("api路径")
    .default("http://127.0.0.1:8699"),
  isPath: Schema.boolean()
    .default(false)
    .description("通过绝对路径获取文件（docker环境建议关闭）"),
  loginfo: Schema.boolean().default(false).description("是否打印API调用日志"),
});

export function apply(ctx: Context, config: Config) {
  ctx
    .command("jmid <id>", "获取指定id jm漫画")
    .action(async ({ session }, id) => {
      await getJM(ctx, config, session, id);
    })
}

const getJM = async (
  ctx: Context,
  config: Config,
  session: Session,
  id: string
) => {
  if (!id) {
    await session.send("未提供id喵~");
    return;
  }
  const isPath = config.isPath;

  // 处理URL，移除末尾的斜杠
  let baseUrl = config.baseUrl.trim();
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1); // 移除最后一个字符
  }

  if (!isPath) {
    const url = `${baseUrl}/get_pdf/${id}`;
    try {
      const pdf_file = await ctx.http.get(url);
      await session.send(h.file(pdf_file, "application/pdf"));
      return;
    } catch (err: any) {
      ctx.logger.error(`API 请求失败: ${err.message}`);
      await session.send(`请求失败，请查看日志！`);
    }
  }
  const url = `${baseUrl}/get_pdf_path/${id}`;

  try {
    const res = await ctx.http.get(url);

    // 日志记录
    if (config.loginfo) {
      ctx.logger.info(`API Response: ${JSON.stringify(res)}`);
    }

    if (res.success) {
      const { data, message, name } = res;
      const file = h.file(pathToFileURL(data).href);
      await session.send(file);
    } else {
      await session.send(`后台发生错误: ${res.message || "未知错误"}`);
      ctx.logger.error(`后台发生错误，请查看日志！`);
    }
  } catch (err: any) {
    ctx.logger.error(`API 请求失败: ${err.message}`);
    await session.send(`请求失败，请查看日志！`);
  }
};
