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

        // 过滤掉包含type标识的条目（只处理真实班级数据）
        const validClasses = data.filter(cls => !cls.type);

        // 加密有效班级数据
        const encryptedData = validClasses.map(cls => ({
            ...cls,
            "class-name": encodeBase64(cls["class-name"]),
            groups: cls.groups.map(group => ({
                ...group,
                students: group.students.map(name => encodeBase64(name))
            }))
        }));

        // 保留原始数组结构（包含可能的标识条目，但只加密有效数据）
        const finalData = [
            ...data.filter(cls => cls.type), // 保留未处理的type标识条目
            ...encryptedData
        ];

        await fs.writeFile(targetPath, JSON.stringify(finalData, null, 2), 'utf8');
        console.log('✅ 加密完成！已生成 students.json（源文件：original_data/students.json）');
    } catch (error) {
        console.error('❌ 加密失败：', error.message);
        process.exit(1);
    }
};

// 加密DrawAPIKey（适配新数组结构，只处理包含students数组的对象）
const encryptDrawAPIKey = async () => {
    try {
        // 源文件：DrawAPIKey.json（未加密的原始数据）
        const originalPath = path.resolve(__dirname, 'original_data/DrawAPIKey.json');
        // 目标文件：DrawAPIKey.json（加密后的数据，供项目使用）
        const targetPath = path.resolve(__dirname, 'src/assets/data/DrawAPIKey.json');

        // 读取文件内容
        const rawData = await fs.readFile(originalPath, 'utf8');
        const data = JSON.parse(rawData);

        // 验证结构是否为数组
        if (!Array.isArray(data)) {
            console.error('❌ original_data/DrawAPIKey.json 格式错误，应为数组结构');
            process.exit(1);
        }

        // 处理数组中的每个对象：保留type标识条目，加密包含students的对象
        const encryptedData = data.map(item => {
            // 如果是type标识条目，直接保留
            if (item.type) {
                return item;
            }
            // 如果包含students数组，加密其中的字符串元素
            if (item.students && Array.isArray(item.students)) {
                return {
                    ...item,
                    students: item.students.map(name =>
                        typeof name === 'string' ? encodeBase64(name) : name
                    )
                };
            }
            // 其他未知结构的条目直接保留
            return item;
        });

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