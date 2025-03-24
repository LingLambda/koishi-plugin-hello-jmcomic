import { existsSync, mkdirSync, writeFileSync } from "fs";
import { Context, Schema, Session } from "koishi";
import type { OneBotBot } from "koishi-plugin-adapter-onebot";
import path from "path";

export const usage = `
  <h2>请先部署 <a href="https://github.com/LingLambda/JMComic-Api">JMComic-Api</a></h2>

  <p>使用： jmid 422866 获取422866编号的jm漫画</p>
`;
export const name = "hello-jmcomic";

export const inject = ["http"];

export interface Config {
  url: string;
  is_path: boolean;
}

export const Config: Schema<Config> = Schema.object({
  url: Schema.string().description("api路径").default("http://127.0.0.1:8699"),
  is_path: Schema.boolean()
    .default(false)
    .description("前后端路径交互（docker环境建议关闭）"),
});

let targetDir = "";

export function apply(ctx: Context, config: Config) {
  targetDir = path.join(ctx.baseDir, "data/jmcomicCache");
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    ctx.logger.info("创建目录成功");
  } else {
    ctx.logger.error("目录已存在");
  }

  ctx
    .command("jmid <id>", "获取指定id jm漫画")
    .action(async ({ session }, id) => {
      getJM(ctx, config, session, id);
    })
    .example("jmid 422866 获取422866编号的jm漫画");
}

const getJM = async (
  ctx: Context,
  config: Config,
  session: Session,
  id: string
) => {
  if (!session.onebot) {
    session.send("暂仅支持onebot适配器喵");
    return;
  }
  if (!id) {
    session.send("未提供id喵");
    return;
  }

  const { url, is_path } = config;
  ctx.http.get(`${url}/get_pdf_path/${id}/${is_path}`).then((res: any) => {
    if (res.success == true) {
      const { data, name } = res;
      if (is_path) {
        session.onebot.uploadGroupFile(session.onebot.group_id, data, name);
        return;
      }
      const base64Data = data.replace(/^data:application\/pdf;base64,/, "");
      const pdfBuffer = Buffer.from(base64Data, "base64");
      const filePath = path.join(targetDir, name);
      // 写入文件
      writeFileSync(filePath, Uint8Array.from(pdfBuffer));

      session.onebot.uploadGroupFile(session.onebot.group_id, filePath, name);
      return;
    } else {
      session.send("后台发生错误");
    }
  });
};
