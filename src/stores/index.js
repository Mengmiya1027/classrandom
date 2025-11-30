// 1. 确保导入 Pinia 核心方法
import {defineStore} from 'pinia'
// 2. 相对路径导入数据文件并解码
import rawStudents from '../assets/data/students.json'
import drawAPIKey from '../assets/data/DrawAPIKey.json';

// 解码base64所有学生文件
const decodeBase64 = (base64Str) => {
    // 先解码 Base64，再处理 UTF-8 中文
    return decodeURIComponent(escape(atob(base64Str)))
};

// 解码base64列表获取受限学生姓名
const initRestrictedData = () => {
    try {
        const studentsSource = Array.isArray(drawAPIKey) && drawAPIKey.length > 1
            ? drawAPIKey[1]
            : {};
        const rawStudentsList = studentsSource.students || [];

        const decodedList = rawStudentsList.map((encodedName, index) => {
            try {
                // 中文Base64解码最优方案：atob -> escape -> decodeURIComponent
                return decodeURIComponent(escape(atob(encodedName)));
            } catch (error) {
                return null;
            }
        });
        const validList = decodedList.filter(name => name?.trim()); // 只过滤空字符串/undefined
        console.log('最终有效APIKey名单：', validList);
        return validList;
    } catch (error) {
        console.error('[名单初始化] 异常：', error.message);
        return [];
    }
};

// 直接获取学生列表
const restrictedNames = initRestrictedData();
/**
 * 初始化数据：给原始学生数据补全 score/probability/duration/other 字段
 * @returns {Array} 处理后的完整班级数据
 */
const initData = () => {
    try {
        // 过滤掉包含type标识的条目，只处理真实班级数据
        const validClasses = rawStudents.filter(cls => !cls.type);

        const processedData = validClasses.map((cls) => ({
            "class-name": decodeBase64(cls["class-name"]),
            groups: cls.groups.map((group) => ({
                "group-id": group["group-id"],
                other: 0,
                students: group.students.map((encryptedName) => ({
                    name: decodeBase64(encryptedName),
                    score: 0,
                    probability: 1,
                    duration: 0
                }))
            }))
        }));
        console.log('[数据初始化] 成功！处理后班级数量：', processedData.length);
        console.log('[数据初始化] 完整数据预览：', processedData);
        return processedData;
    } catch (error) {
        console.error('[数据初始化] 失败！原因：', error.message);
        return [];
    }
}

// 3. 定义并导出 Pinia Store
export const useMainStore = defineStore('main', {
    state: () => ({
        allClasses: initData(), // 所有班级的完整数据（初始化后的值）
        currentClass: null, // 当前选中的班级（null 表示未选）
        drawHistory: [], // 抽取历史记录（格式：[{name, groupId, time}]）
        showEdit: false, // 编辑页显示状态（true 显示 / false 隐藏）
        showStatistics: false, // 统计页显示状态（true 显示 / false 隐藏）
        currentDrawResult: null, // 当前抽中学生的完整信息（含 groupId/name 等）
        adjustmentPopup: {
            show: false,    // 是否显示弹窗
            type: '',       // 弹窗类型：'probability'（概率修改）/ 'error'（错误）
            name: '',       // 抽中者姓名（仅probability类型使用）
            message: ''     // 弹窗提示内容
        }
    }),
    actions: {
        /**
         * 选择班级
         * @param {string} className - 要选中的班级名称（如 "8班"）
         */
        selectClass(className) {
            console.log('[班级操作] 触发选择班级：', className)
            const targetClass = this.allClasses.find(cls => cls["class-name"] === className)

            if (targetClass) {
                this.currentClass = targetClass
                console.log('[班级操作] 选择成功！当前班级：', targetClass["class-name"])
            } else {
                this.currentClass = null
                console.warn('[班级操作] 选择失败！未找到班级：', className)
            }
        },

        /**
         * 控制编辑页显示/隐藏
         * @param {boolean} show - true 显示，false 隐藏
         */
        setShowEdit(show) {
            this.showEdit = show
            console.log('[页面控制] 编辑页状态：', show ? '显示' : '隐藏')
        },

        /**
         * 控制统计页显示/隐藏
         * @param {boolean} show - true 显示，false 隐藏
         */
        setShowStatistics(show) {
            this.showStatistics = show
            console.log('[页面控制] 统计页状态：', show ? '显示' : '隐藏')
        },

        /**
         * 核心抽取方法（根据模式计算概率并抽取学生）
         * @param {string} mode - 抽取模式（normal/group-fair/personal-fair）
         * @returns {Object|null} 抽中学生信息（失败返回 null）
         */
        drawStudent(mode) {
            if (!this.currentClass) {
                console.error('[抽取操作] 失败！未选择班级')
                return null
            }

            console.log('=====================================')
            console.log('[抽取操作] 开始！模式：', mode, '| 当前历史记录数：', this.drawHistory.length)
            console.log('[抽取操作] 当前班级：', this.currentClass["class-name"])

            // 整理当前班级学生（关联小组ID）
            const allStudents = this.currentClass.groups.flatMap(group =>
                group.students.map(student => ({
                    ...student,
                    groupId: group["group-id"],
                    originalGroup: group
                }))
            )
            console.log('[抽取操作] 学生总数：', allStudents.length)

            // 根据模式处理概率
            let studentsWithProbability = []
            switch (mode) {
                case 'normal':
                    studentsWithProbability = this.handleNormalMode(allStudents)
                    break
                case 'fair':
                    studentsWithProbability = this.handleFairMode(allStudents)
                    break
                case 'group-fair':
                    studentsWithProbability = this.handleGroupFairMode(allStudents)
                    break
                case 'old-group-fair':
                    studentsWithProbability = this.handleOldGroupFairMode(allStudents)
                    break
                default:
                    console.warn('[抽取操作] 未知模式，默认使用普通模式')
                    studentsWithProbability = this.handleNormalMode(allStudents)
            }

            console.log("[调试信息] 受限名单：" + restrictedNames)

            // 计算总概率
            const totalProbability = studentsWithProbability.reduce((sum, student) =>
                sum + student.finalProbability, 0)
            console.log('[抽取概率计算] 总概率值：', totalProbability.toFixed(4)) // 保留4位小数便于查看


            let selectedStudent = null
            let maxAttempts = 100 // 防止无限循环的最大尝试次数
            let attempts = 0

            // 循环抽取直到符合条件
            do {
                attempts++
                console.log(`\n[抽取过程] 开始第${attempts}次尝试抽取`)

                // 执行加权随机抽取
                selectedStudent = this.weightedRandom(studentsWithProbability)

                // 检查抽取结果是否有效
                if (!selectedStudent) {
                    console.warn('[抽取过程] 抽取失败，未获取到有效学生')
                    continue
                }

                // 输出当前抽中学生的基础信息
                console.log('[抽取过程] 抽中候选学生：',
                    `姓名=${selectedStudent.name}，`,
                    `小组ID=${selectedStudent.groupId}，`,
                    `个人概率=${selectedStudent.finalProbability.toFixed(4)}，`,
                    `占总概率比例=${(selectedStudent.finalProbability / totalProbability * 100).toFixed(2)}%`
                )

                // 检查是否在受限名单中
                const isInRestrictedList = restrictedNames.includes(selectedStudent.name)
                console.log('[抽取校验] 是否在受限名单中：', isInRestrictedList ? '是' : '否')

                // 检查概率占比是否低于20%
                const probabilityRatio = selectedStudent.finalProbability / totalProbability
                const isBelow20Percent = probabilityRatio < 0.2
                console.log('[抽取校验] 概率占比是否低于20%：',
                    isBelow20Percent ? `是（${(probabilityRatio * 100).toFixed(2)}%）` : `否（${(probabilityRatio * 100).toFixed(2)}%）`
                )

                // 检查是否超过最大尝试次数
                if (attempts >= maxAttempts) {
                    console.warn('[抽取过程] 达到最大尝试次数（${maxAttempts}次），强制终止循环', {
                        最终抽中学生: selectedStudent.name,
                        是否符合条件: !isInRestrictedList || !isBelow20Percent
                    })
                    break
                }

                // 输出重新抽取原因（如果需要）
            } while (selectedStudent &&
            restrictedNames.includes(selectedStudent.name) &&
            (selectedStudent.finalProbability / totalProbability) < 0.2)

            // 输出最终抽取结果总结
            if (selectedStudent) {
                console.log('\n[抽取结果] 最终确定抽中学生：',
                    `姓名=${selectedStudent.name}，`,
                    `经过${attempts}次尝试，`,
                    `是否符合条件：${!restrictedNames.includes(selectedStudent.name) || (selectedStudent.finalProbability / totalProbability) >= 0.2 ? '是' : '否'}`
                )
            }

            // 记录结果
            if (selectedStudent) {
                this.currentDrawResult = selectedStudent
                const historyRecord = {
                    name: selectedStudent.name,
                    groupId: selectedStudent.groupId,
                    time: new Date().getTime()
                }
                this.drawHistory.push(historyRecord)
                console.log('[抽取操作] 抽中：', `组${selectedStudent.groupId}-${selectedStudent.name}`)
                console.log('[抽取操作] 历史记录更新后总数：', this.drawHistory.length)

                // 新增：补全小组公平模式下的弹窗标题
                if ((mode === 'group-fair' || mode === 'old-group-fair') && this.adjustmentPopup.show && this.adjustmentPopup.type === 'probability') {
                    // 保持原有消息不变，只更新标题为抽中人姓名
                    this.setAdjustmentPopup(
                        true,
                        'probability',
                        selectedStudent.name, // 补全标题
                        this.adjustmentPopup.message // 复用已有的消息
                    );
                }
            } else {
                this.currentDrawResult = null
                console.error('[抽取操作] 失败！未抽中任何学生')
            }
            console.log('=====================================')
            return selectedStudent
        },

        /**
         * 普通模式：所有学生等概率抽取
         * @param {Array} students - 学生列表
         * @returns {Array} 带最终概率的学生列表
         */
        handleNormalMode(students) {
            console.log('[模式处理] 普通模式：所有学生概率设为1（等概率）')
            return students.map(student => ({
                ...student,
                finalProbability: 1
            }))
        },

        /**
         * 固定概率模式：根据editpage.vue中的配置进行抽取，除持续时间外不进行概率调整
         * @param {Array} allStudents - 学生列表
         * @returns {Array} 带最终概率的学生列表
         */
        handleFairMode(allStudents) {
            console.log('[模式处理] 固定概率模式：根据个人配置进行抽取，不调整概率（持续时间除外）')

            // 步骤1：始终处理duration（每次抽取都递减，归0重置概率）
            this.currentClass.groups.forEach(group => {
                group.students.forEach(student => {
                    // 保护机制：fair模式只在修改了duration时才重置概率
                    if (student.duration > 0) {
                        student.duration -= 1
                        if (student.duration === 0 && student.probability !== 1) {
                            student.probability = 1 // 归0后重置为初始概率
                            console.log(`[Duration处理] ${student.name}：duration归0，概率重置为1`)
                        }
                    }
                })
            })

            // 步骤2：根据个人配置概率进行抽取
            return allStudents.map(student => ({
                ...student,
                finalProbability: student.probability // 直接使用配置概率
            }))
        },

        /**
         * 小组公平模式：仅在历史记录为10的倍数时，基于最近10次小组记录调整概率
         * 核心：直接修改原始数据确保概率持久化，非调整阶段使用最新概率
         * @param {Array} students - 临时学生列表（用于匹配原始数据）
         * @returns {Array} 带最终概率的学生列表（基于原始数据）
         */
        handleGroupFairMode(students) {
            console.log('[模式处理] 小组公平模式：开始处理')
            const historyLength = this.drawHistory.length // 当前历史总条数
            const shouldAdjustProb = historyLength > 0 && (historyLength + 1) % 10 === 0 // 10的倍数且非0

            // 步骤1：仅10的倍数时触发概率调整（修改原始数据）
            if (shouldAdjustProb) {
                console.log(`[模式处理] 小组公平模式 - 触发调整（历史数：${historyLength}，10的倍数）`)
                const recentGroupCounts = this.countRecentGroupDraws(10) // 统计最近10次小组次数

                // 收集调整信息（用于弹窗）
                const adjustedGroups = []

                // 遍历原始班级数据，直接修改原始学生对象（持久化概率）
                this.currentClass.groups.forEach(group => {
                    const groupId = group["group-id"]
                    const groupCount = recentGroupCounts[groupId] || 0

                    // 只处理需要调整的小组（次数<2或>4）
                    if (groupCount < 2 || groupCount > 4) {
                        // 遍历小组内所有学生
                        group.students.forEach(originalStudent => {
                            // 只修改持续时间>-1的学生的概率
                            if (originalStudent.duration === 0) {
                                const oldProb = originalStudent.probability // 记录调整前概率

                                // 上调：次数<2 → 概率+0.3，duration=10
                                if (groupCount < 2) {
                                    if (originalStudent.probability < 1) {
                                        originalStudent.probability = 1.3
                                    } else {
                                        originalStudent.probability += 0.3
                                    }
                                    originalStudent.duration = 10
                                    console.log(`[概率调整] 组${groupId}-${originalStudent.name}：${oldProb} → ${originalStudent.probability}（次数${groupCount}<2）`)
                                }
                                // 下调：次数>2 → 概率-0.3（最低0.1），duration=10
                                else if (groupCount > 2) {
                                    if (originalStudent.probability > 1) {
                                        originalStudent.probability = 0.7
                                    } else {
                                        originalStudent.probability -= 0.3
                                    }
                                    originalStudent.duration = 10
                                    console.log(`[概率调整] 组${groupId}-${originalStudent.name}：${oldProb} → ${originalStudent.probability}（次数${groupCount}>4）`)
                                }

                                // 收集调整信息（去重，每个小组只记录一次）
                                if (adjustedGroups.every(g => g.groupId !== groupId)) {
                                    adjustedGroups.push({
                                        groupId,
                                        count: groupCount,
                                        change: groupCount < 2 ? '上升' : '下降',
                                        newProb: Math.round(originalStudent.probability * 100) + '%', // 调整后的值
                                        duration: 10
                                    })
                                }
                            }
                        })
                    }
                })

                // 生成弹窗信息
                let message = '小组概率调整：\n'
                adjustedGroups.forEach((g, i) => {
                    message += `组${g.groupId}（近10次${g.count}次）：概率${g.change}至${g.newProb}，持续${g.duration}次`
                    if (i < adjustedGroups.length - 1) message += '；\n'
                })

                this.setAdjustmentPopup(
                    true,
                    'probability',
                    '', // 标题先留空，后续补充
                    message
                );
            } else {
                console.log(`[模式处理] 小组公平模式 - 不调整（历史数：${historyLength}，非10倍数）`)
            }

            // 步骤2：始终处理duration（每次抽取都递减，归0重置概率）
            this.currentClass.groups.forEach(group => {
                group.students.forEach(student => {
                    // 公平机制：为了防止无意篡改，始终重置duration=0时的概率
                    if (student.duration === 0 && student.probability !== 1) {
                        student.probability = 1 // 归0后重置为初始概率
                        console.log(`[Duration处理] 组${group["group-id"]}-${student.name}：duration归0，概率重置为1`)
                    }
                    if (student.duration > 0) {
                        student.duration -= 1
                    }
                })
            })

            // 步骤3：返回基于原始数据的最终概率（确保使用最新值）
            return this.currentClass.groups.flatMap(group =>
                group.students.map(student => ({
                    ...student,
                    groupId: group["group-id"],
                    finalProbability: student.probability // 直接读取原始数据的当前概率
                }))
            )
        },
        /**
         * 个人公平模式：仅在历史记录为10的倍数时，基于最近10次个人记录调整概率
         * 核心：直接修改原始数据确保概率持久化，非调整阶段使用最新概率
         * @param {Array} students - 临时学生列表（用于匹配原始数据）
         * @returns {Array} 带最终概率的学生列表（基于原始数据）
         */
        handleOldGroupFairMode(students) {
            console.log('[模式处理] 旧小组公平模式：开始处理')
            const historyLength = this.drawHistory.length // 当前历史总条数
            const shouldAdjustProb = historyLength > 0 && (historyLength + 1) % 10 === 0 // 10的倍数且非0

            // 步骤1：始终处理duration（每次抽取都递减，归0重置概率）
            this.currentClass.groups.forEach(group => {
                group.students.forEach(student => {
                    // 公平机制：为了防止无意篡改，始终重置duration=0时的概率
                    if (student.duration > 0) {
                        student.duration -= 1
                    }
                    if (student.duration === 0 && student.probability !== 1) {
                        student.probability = 1 // 归0后重置为初始概率
                        console.log(`[Duration处理] 组${group["group-id"]}-${student.name}：duration归0，概率重置为1`)
                    }
                })
            })

            // 步骤2：仅10的倍数时触发概率调整（修改原始数据）
            if (shouldAdjustProb) {
                console.log(`[模式处理] 旧小组公平模式 - 触发调整（历史数：${historyLength}，10的倍数）`)
                const recentGroupCounts = this.countRecentGroupDraws(10) // 统计最近10次小组次数

                // 收集调整信息（用于弹窗）
                const adjustedGroups = []

                // 遍历原始班级数据，直接修改原始学生对象（持久化概率）
                this.currentClass.groups.forEach(group => {
                    const groupId = group["group-id"]
                    const groupCount = recentGroupCounts[groupId] || 0

                    // 只处理需要调整的小组（次数<2或>4）
                    if (groupCount < 2 || groupCount > 4) {
                        // 遍历小组内所有学生
                        group.students.forEach(originalStudent => {
                            // 只修改持续时间>-1的学生的概率
                            if (originalStudent.duration === 0) {
                                const oldProb = originalStudent.probability // 记录调整前概率

                                // 上调：次数<2 → 概率+0.3，duration=10
                                if (groupCount < 1) {
                                    originalStudent.probability += 0.3
                                    originalStudent.duration = 10
                                    console.log(`[概率调整] 组${groupId}-${originalStudent.name}：${oldProb} → ${originalStudent.probability}（次数${groupCount}<2）`)
                                }
                                // 下调：次数>4 → 概率-0.3（最低0.1），duration=10
                                else if (groupCount > 1) {
                                    originalStudent.probability = Math.max(0.1, originalStudent.probability - 0.3)
                                    originalStudent.duration = 10
                                    console.log(`[概率调整] 组${groupId}-${originalStudent.name}：${oldProb} → ${originalStudent.probability}（次数${groupCount}>4）`)
                                }

                                // 收集调整信息（去重，每个小组只记录一次）
                                if (adjustedGroups.every(g => g.groupId !== groupId)) {
                                    adjustedGroups.push({
                                        groupId,
                                        count: groupCount,
                                        change: groupCount < 2 ? '上升' : '下降',
                                        newProb: Math.round(originalStudent.probability * 100) + '%', // 调整后的值
                                        duration: 10
                                    })
                                }
                            }
                        })
                    }
                })

                // 生成弹窗信息
                let message = '小组概率调整：\n'
                adjustedGroups.forEach((g, i) => {
                    message += `组${g.groupId}（近10次${g.count}次）：概率${g.change}至${g.newProb}，持续${g.duration}次`
                    if (i < adjustedGroups.length - 1) message += '；\n'
                })

                this.setAdjustmentPopup(
                    true,
                    'probability',
                    '', // 标题先留空，后续补充
                    message
                );
            } else {
                console.log(`[模式处理] 旧小组公平模式 - 不调整（历史数：${historyLength}，非10倍数）`)
            }

            // 步骤3：返回基于原始数据的最终概率（确保使用最新值）
            return this.currentClass.groups.flatMap(group =>
                group.students.map(student => ({
                    ...student,
                    groupId: group["group-id"],
                    finalProbability: student.probability // 直接读取原始数据的当前概率
                }))
            )
        },

        /**
         * 统计最近N次抽取的小组次数
         * @param {number} limit - 统计条数上限
         * @returns {Object} {groupId: 次数}
         */
        countRecentGroupDraws(limit) {
            const counts = {}
            const recentHistory = this.drawHistory.slice(-limit) // 取最近limit条
            recentHistory.forEach(record => {
                counts[record.groupId] = (counts[record.groupId] || 0) + 1
            })
            console.log('[统计工具] 最近', limit, '次小组次数：', counts)
            return counts
        },

        /**
         * 统计最近N次抽取的个人次数
         * @param {number} limit - 统计条数上限
         * @returns {Object} {name: 次数}
         */
        countRecentPersonDraws(limit) {
            const counts = {}
            const recentHistory = this.drawHistory.slice(-limit)
            recentHistory.forEach(record => {
                counts[record.name] = (counts[record.name] || 0) + 1
            })
            console.log('[统计工具] 最近', limit, '次个人次数：', counts)
            return counts
        },

        /**
         * 加权随机算法：根据finalProbability抽取学生
         * @param {Array} students - 带finalProbability的学生列表
         * @returns {Object|null} 抽中学生
         */
        weightedRandom(students) {
            // 计算总概率（过滤负概率）
            const totalProbability = students.reduce((sum, s) => {
                const validProb = Math.max(0, s.finalProbability)
                return sum + validProb
            }, 0)

            if (totalProbability <= 0) {
                console.error('[随机算法] 总概率为0，无法抽取')
                this.setAdjustmentPopup(
                    true,          // 显示弹窗
                    'error',       // 错误类型
                    '抽取失败：总概率为0',            // 无需姓名
                    '不能在所有学生的概率都为0时抽取。\n 请点击右下角的“编辑”，调整概率后重试。' // 提示信息
                );
                return null;
            }

            const randomValue = Math.random() * totalProbability
            console.log('[随机算法] 总概率：', totalProbability, '| 随机数：', randomValue)

            // 查找随机数所在区间
            let currentSum = 0
            for (const student of students) {
                const validProb = Math.max(0, student.finalProbability)
                currentSum += validProb
                if (randomValue <= currentSum) {
                    console.log('[随机算法] 抽中区间：', `[${currentSum - validProb}, ${currentSum}]`)
                    return student
                }
            }

            // 兜底（理论上不会触发）
            console.warn('[随机算法] 未匹配区间，返回第一个学生')
            return students[0] || null
        },

        // 控制弹窗显示/隐藏的统一方法
        setAdjustmentPopup(show, type = '', title = '', message = '') {
            this.adjustmentPopup = {
                show,    // 布尔值：true显示 / false隐藏
                type,    // 弹窗类型：'probability' 或 'error'
                title,   // 弹窗标题
                message  // 弹窗提示文本
            };
            // 可选：调试日志（可删除）
            console.log(`[弹窗状态] 类型: ${type} | 状态: ${show ? '显示' : '隐藏'}`);
        },
    }
})