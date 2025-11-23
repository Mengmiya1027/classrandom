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
const encryptStudents = async () => {
    try {
        // 源文件：students.json（未加密的原始数据）
        const originalPath = path.resolve(__dirname, 'original_data/students.json');
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
        console.log('✅ 加密完成！已生成 students.json（源文件：original_data/students.json）');
    } catch (error) {
        console.error('❌ 加密失败：', error.message);
        process.exit(1);
    }
};


// 加密 DrawAPIKey.json 的逻辑（列表类型，全部加密）
const encryptDrawAPIKey = async () => {
    try {
        // 源文件：DrawAPIKey.json（未加密的原始数据）
        const originalPath = path.resolve(__dirname, 'original_data/DrawAPIKey.json');
        // 目标文件：DrawAPIKey.json（加密后的数据，供项目使用）
        const targetPath = path.resolve(__dirname, 'src/assets/data/DrawAPIKey.json');

        // 读取文件内容
        const rawData = await fs.readFile(originalPath, 'utf8');
        const data = JSON.parse(rawData);

        // 检查是否为数组类型
        if (!Array.isArray(data)) {
            console.error('❌ original-data/DrawAPIKey.json 不是列表类型');
            process.exit(1);
        }

        // 全部加密（递归处理数组中的所有元素）
        const encryptRecursive = (item) => {
            if (Array.isArray(item)) {
                return item.map(encryptRecursive);
            } else if (typeof item === 'object' && item !== null) {
                const encryptedObj = {};
                for (const key in item) {
                    encryptedObj[key] = encryptRecursive(item[key]);
                }
                return encryptedObj;
            } else if (typeof item === 'string') {
                return encodeBase64(item);
            }
            // 对于非字符串类型（如数字、布尔值），保持原样
            return item;
        };

        const encryptedData = encryptRecursive(data);

        // 写入加密后的数据（格式化输出）
        await fs.writeFile(targetPath, JSON.stringify(encryptedData, null, 2), 'utf8');
        console.log('✅ 加密完成！已生成 DrawAPIKey.json（源文件：original_data/DrawAPIKey.json）');
    } catch (error) {
        console.error('❌ DrawAPIKey.json 加密失败：', error.message);
        process.exit(1);
    }
};

// 执行所有加密操作
const encryptAll = async () => {
    await encryptStudents();
    await encryptDrawAPIKey();
};

// 执行加密
encryptAll();