import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 ES 模块中 __dirname 未定义的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base64 加密函数（支持中文）
const encodeBase64 = (str) => {
    return Buffer.from(str, 'utf8').toString('base64');
};

// 加密逻辑主函数
const encryptJson = async () => {
    try {
        // 源文件：original-students.json（未加密的原始数据）
        const originalPath = path.resolve(__dirname, 'original-students.json');
        // 目标文件：students.json（加密后的数据，供项目使用）
        const targetPath = path.resolve(__dirname, 'src/assets/data/students.json');


        // 读取文件内容
        const rawData = await fs.readFile(originalPath, 'utf8');
        const data = JSON.parse(rawData);

        // 加密指定字段
        const encryptedData = data.map(cls => ({
            ...cls,
            "class-name": encodeBase64(cls["class-name"]),
            groups: cls.groups.map(group => ({
                ...group,
                students: group.students.map(name => encodeBase64(name))
            }))
        }));

        // 写入加密后的数据（格式化输出）
        await fs.writeFile(targetPath, JSON.stringify(encryptedData, null, 2), 'utf8');
        console.log('✅ 加密完成！已生成 students.json（源文件：original-students.json）');
    } catch (error) {
        console.error('❌ 加密失败：', error.message);
    }
};

// 执行加密
encryptJson();