interface Question {
  id: string;
  content: string;
  dimension: string;
  type: 'positive_preference' | 'positive_talent' | 'negative_preference' | 'negative_talent';
  element: string;
}

interface ScaleDimension {
  name: string;
  questions: Question[];
}

interface ScaleStructure {
  positive_preference: ScaleDimension[];
  negative_preference: ScaleDimension[];
  positive_talent: ScaleDimension[];
  negative_talent: ScaleDimension[];
}

export const dimensions: ScaleStructure = {
  positive_preference: [
    {
      name: "看维度",
      questions: [
        { id: "pQL-1", content: "动物相关内容，更能引发兴趣", dimension: "看维度", type: "positive_preference", element: "看-来自大自然或自然环境中 - 动的" },
        { id: "pQL-2", content: "喜欢植物、山水、星空", dimension: "看维度", type: "positive_preference", element: "看-来自大自然或自然环境中 - 静的" },
        { id: "pQL-3", content: "了解人类，感兴趣", dimension: "看维度", type: "positive_preference", element: "看-人类学习/工作/生活环境中 - 与人相关的" },
        { id: "pQL-4", content: "琢磨物件，很乐意", dimension: "看维度", type: "positive_preference", element: "看-人类学习/工作/生活环境中 - 与物相关的" }
      ]
    },
    {
      name: "听维度",
      questions: [
        { id: "pQL-5", content: "倾听声/音/乐/歌，孩子乐趣所在", dimension: "听维度", type: "positive_preference", element: "听-在接收中听 - 人/乐器声为主旋律的音/乐" },
        { id: "pQL-6", content: "懂得欣赏自然之声", dimension: "听维度", type: "positive_preference", element: "听-在接收中听 - 雨声/鸟鸣等自然之声" },
        { id: "pQL-7", content: "喜欢聊着听", dimension: "听维度", type: "positive_preference", element: "听-在交互中听 - 交谈" },
        { id: "pQL-8", content: "喜欢唱歌、玩乐器", dimension: "听维度", type: "positive_preference", element: "听-在交互中听 - 玩出声音，如玩乐器/玩具" }
      ]
    },
    {
      name: "记维度",
      questions: [
        { id: "pQL-9", content: "喜欢记忆经历过的点点滴滴", dimension: "记维度", type: "positive_preference", element: "记-自动记忆 - 生活中亲身体验过的" },
        { id: "pQL-10", content: "乐意回忆看过的书、影视作品里的内容与情景", dimension: "记维度", type: "positive_preference", element: "记-自动记忆 - 看书/影视作品等看到的或听说的" },
        { id: "pQL-11", content: "需要记的内容，只要理解，就愿意记", dimension: "记维度", type: "positive_preference", element: "记-主动记忆 - 理解的" },
        { id: "pQL-12", content: "需要记的内容，哪怕不理解，也乐意记住", dimension: "记维度", type: "positive_preference", element: "记-主动记忆 - 不理解的" }
      ]
    },
    {
      name: "想维度",
      questions: [
        { id: "pQL-13", content: "对过去、现在、未来的生活想象丰富", dimension: "想维度", type: "positive_preference", element: "想-自然联想 - 与现实生活有关的" },
        { id: "pQL-14", content: "天马行空的想象，塑造着丰富的内心世界", dimension: "想维度", type: "positive_preference", element: "想-自然联想 - 与现实生活无关的" },
        { id: "pQL-15", content: "一旦有目标，就会想方法", dimension: "想维度", type: "positive_preference", element: "想-刻意思考 - 想达到的" },
        { id: "pQL-16", content: "就算没目标，也不断琢磨各种妙法", dimension: "想维度", type: "positive_preference", element: "想-刻意思考 - 不需要达到的" }
      ]
    },
    {
      name: "说维度",
      questions: [
        { id: "pQL-17", content: "人越多，越爱说", dimension: "说维度", type: "positive_preference", element: "说-沟通 - 多人沟通" },
        { id: "pQL-18", content: "一对一，挺话痨", dimension: "说维度", type: "positive_preference", element: "说-沟通 - 一对一" },
        { id: "pQL-19", content: "滔滔不绝，自带舞台感", dimension: "说维度", type: "positive_preference", element: "说-演说 - 分享" },
        { id: "pQL-20", content: "绘声绘色，各种表演", dimension: "说维度", type: "positive_preference", element: "说-演说 - 表演" }
      ]
    },
    {
      name: "做维度",
      questions: [
        { id: "pQL-21", content: "动手的同时喜欢动脑，享受逻辑演算", dimension: "做维度", type: "positive_preference", element: "做-能独立完成的 - 偏思维运算类" },
        { id: "pQL-22", content: "享受动手的时光、哪怕无需动脑", dimension: "做维度", type: "positive_preference", element: "做-能独立完成的 - 偏手工制作类" },
        { id: "pQL-23", content: "为一起玩，愿做出让步", dimension: "做维度", type: "positive_preference", element: "做-不能独立完成的 - 一对一协作" },
        { id: "pQL-24", content: "为了大家一起玩儿，愿干好多活", dimension: "做维度", type: "positive_preference", element: "做-不能独立完成的 - 多人协作" }
      ]
    },
    {
      name: "运动维度",
      questions: [
        { id: "pQL-25", content: "为体验协调感，乐意创造变化", dimension: "运动维度", type: "positive_preference", element: "运动-技巧类 - 变化中协调" },
        { id: "pQL-26", content: "为享受平衡感，经常各种移动", dimension: "运动维度", type: "positive_preference", element: "运动-技巧类 - 移动中平衡" },
        { id: "pQL-27", content: "享受爆发时保持稳定的掌控感", dimension: "运动维度", type: "positive_preference", element: "运动-非技巧类 - 爆发时保持稳定" },
        { id: "pQL-28", content: "像大号电池，喜欢一直玩儿一直玩儿持续放电的感觉", dimension: "运动维度", type: "positive_preference", element: "运动-技巧类 - 持续中保持活力" }
      ]
    }
  ],
  negative_preference: [
    {
      name: "看维度",
      questions: [
        { id: "nQL-1", content: "自然动物，不太能吸引其注意力", dimension: "看维度", type: "negative_preference", element: "看-来自大自然或自然环境中 - 动的" },
        { id: "nQL-2", content: "自然静物，也许不会非常有兴趣", dimension: "看维度", type: "negative_preference", element: "看-来自大自然或自然环境中 - 静的" },
        { id: "nQL-3", content: "对人可能不太关注", dimension: "看维度", type: "negative_preference", element: "看-人类学习/工作/生活环境中 - 与人相关的" },
        { id: "nQL-4", content: "对物的观察可能不是很上心", dimension: "看维度", type: "negative_preference", element: "看-人类学习/工作/生活环境中 - 与物相关的" }
      ]
    },
    {
      name: "听维度",
      questions: [
        { id: "nQL-5", content: "声/音/乐/歌，较少主动或自发欣赏", dimension: "听维度", type: "negative_preference", element: "听-在接收中听 - 人/乐器声为主旋律的音/乐" },
        { id: "nQL-6", content: "自然之声，较少自然而然沉浸其中", dimension: "听维度", type: "negative_preference", element: "听-在接收中听 - 雨声/鸟鸣等自然之声" },
        { id: "nQL-7", content: "交谈中倾听，未必乐意", dimension: "听维度", type: "negative_preference", element: "听-在交互中听 - 交谈" },
        { id: "nQL-8", content: "唱歌或玩乐器，未见兴趣", dimension: "听维度", type: "negative_preference", element: "听-在交互中听 - 玩出声音，如玩乐器/玩具" }
      ]
    },
    {
      name: "记维度",
      questions: [
        { id: "nQL-9", content: "生活经历，较少主动或自发提及", dimension: "记维度", type: "negative_preference", element: "记-自动记忆 - 生活中亲身体验过的" },
        { id: "nQL-10", content: "看书看剧，很少自觉或自愿提及", dimension: "记维度", type: "negative_preference", element: "记-自动记忆 - 看书/影视作品等看到的或听说的" },
        { id: "nQL-11", content: "理解的，未必愿意主动记忆", dimension: "记维度", type: "negative_preference", element: "记-主动记忆 - 理解的" },
        { id: "nQL-12", content: "不理解的内容，不太愿意主动或自发记忆", dimension: "记维度", type: "negative_preference", element: "记-主动记忆 - 不理解的" }
      ]
    },
    {
      name: "想维度",
      questions: [
        { id: "nQL-13", content: "不会过多想象未来生活的各种可能性", dimension: "想维度", type: "negative_preference", element: "想-自然联想 - 与现实生活有关的" },
        { id: "nQL-14", content: "对和现实生活无关的东西，不爱联想", dimension: "想维度", type: "negative_preference", element: "想-自然联想 - 与现实生活无关的" },
        { id: "nQL-15", content: "就算想要的，也未必一直琢磨、不断想方法实现", dimension: "想维度", type: "negative_preference", element: "想-刻意思考 - 想达到的" },
        { id: "nQL-16", content: "如果不是需要达成的目标，很少会因为兴趣，不断琢磨", dimension: "想维度", type: "negative_preference", element: "想-刻意思考 - 不需要达到的" }
      ]
    },
    {
      name: "说维度",
      questions: [
        { id: "nQL-17", content: "人多时，经常是说话相对偏少的那个", dimension: "说维度", type: "negative_preference", element: "说-沟通 - 多人沟通" },
        { id: "nQL-18", content: "一对一，不爱聊天", dimension: "说维度", type: "negative_preference", element: "说-沟通 - 一对一" },
        { id: "nQL-19", content: "让分享，总有点抵触", dimension: "说维度", type: "negative_preference", element: "说-演说 - 分享" },
        { id: "nQL-20", content: "让表演，会有些抗拒", dimension: "说维度", type: "negative_preference", element: "说-演说 - 表演" }
      ]
    },
    {
      name: "做维度",
      questions: [
        { id: "nQL-21", content: "又要动手又要动脑时，会有些犯懒", dimension: "做维度", type: "negative_preference", element: "做-能独立完成的 - 偏思维运算类" },
        { id: "nQL-22", content: "光动手，不那么需要逻辑推演时，不怎么感兴趣", dimension: "做维度", type: "negative_preference", element: "做-能独立完成的 - 偏手工制作类" },
        { id: "nQL-23", content: "大家一起玩时，不是很投入", dimension: "做维度", type: "negative_preference", element: "做-不能独立完成的 - 一对一协作" },
        { id: "nQL-24", content: "不会为了和朋友一起玩，过于主动付出", dimension: "做维度", type: "negative_preference", element: "做-不能独立完成的 - 多人协作" }
      ]
    },
    {
      name: "运动维度",
      questions: [
        { id: "nQL-25", content: "变化太多的活动，参与积极性不高", dimension: "运动维度", type: "negative_preference", element: "运动-技巧类 - 变化中协调" },
        { id: "nQL-26", content: "平衡要求高的活动，投入度不足", dimension: "运动维度", type: "negative_preference", element: "运动-技巧类 - 移动中平衡" },
        { id: "nQL-27", content: "猛烈冲击类活动，掌控欲不足", dimension: "运动维度", type: "negative_preference", element: "运动-非技巧类 - 爆发时保持稳定" },
        { id: "nQL-28", content: "重复度高且体力输出大的活动，不愿持续投入", dimension: "运动维度", type: "negative_preference", element: "运动-技巧类 - 持续中保持活力" }
      ]
    }
  ],
  positive_talent: [
    {
      name: "看维度",
      questions: [
        { id: "pQT-1", content: "对人观察细致", dimension: "看维度", type: "positive_talent", element: "看-能发现有趣的点 - 人所展现的" },
        { id: "pQT-2", content: "对物发现深入", dimension: "看维度", type: "positive_talent", element: "看-能发现有趣的点 - 事/物所展现的" },
        { id: "pQT-3", content: "能用人所长", dimension: "看维度", type: "positive_talent", element: "看-能发现有用的点 - 人所具备的" },
        { id: "pQT-4", content: "能用物所长", dimension: "看维度", type: "positive_talent", element: "看-能发现有用的点 - 事/物所具备的" }
      ]
    },
    {
      name: "听维度",
      questions: [
        { id: "pQT-5", content: "善于理解言辞语意", dimension: "听维度", type: "positive_talent", element: "听-能听出相同的点 - 熟悉内容" },
        { id: "pQT-6", content: "善于模仿各类发音", dimension: "听维度", type: "positive_talent", element: "听-能听出相同的点 - 不熟悉内容" },
        { id: "pQT-7", content: "对语言中不认同的部分反应敏感", dimension: "听维度", type: "positive_talent", element: "听-能听出不同的点 - 需理解内容" },
        { id: "pQT-8", content: "对声音中不和谐的点辨识能力强", dimension: "听维度", type: "positive_talent", element: "听-能听出不同的点 - 不需理解内容" }
      ]
    },
    {
      name: "记维度",
      questions: [
        { id: "pQT-9", content: "对引起过情感共鸣或情绪波动的内容印象深刻", dimension: "记维度", type: "positive_talent", element: "记-能记住有意义的内容 - 印象深刻的内容" },
        { id: "pQT-10", content: "对启发过自己的内容记忆犹新", dimension: "记维度", type: "positive_talent", element: "记-能记住有意义的内容 - 得到启发的内容" },
        { id: "pQT-11", content: "善于记住有用、而且马上能用的内容", dimension: "记维度", type: "positive_talent", element: "记-能记住有价值的内容 - 马上要用到" },
        { id: "pQT-12", content: "对于将来能用的内容，会习惯性记住", dimension: "记维度", type: "positive_talent", element: "记-能记住有价值的内容 - 将来能用到" }
      ]
    },
    {
      name: "想维度",
      questions: [
        { id: "pQT-13", content: "创意奇特，且可行", dimension: "想维度", type: "positive_talent", element: "想-能想到奇特的点子 - 可预见实现时间" },
        { id: "pQT-14", content: "创意奇特，是否可行，不在其考虑范围", dimension: "想维度", type: "positive_talent", element: "想-能想到奇特的点子 - 不可预见实现时间" },
        { id: "pQT-15", content: "创意实用，当下可行", dimension: "想维度", type: "positive_talent", element: "想-能想到实用的点子 - 马上能用" },
        { id: "pQT-16", content: "创意实用，具前瞻性", dimension: "想维度", type: "positive_talent", element: "想-能想到实用的点子 - 以后能用" }
      ]
    },
    {
      name: "说维度",
      questions: [
        { id: "pQT-17", content: "多人沟通时，言辞简洁，能增进共识", dimension: "说维度", type: "positive_talent", element: "说-能说出对方一听就明白的话 - 多人沟通" },
        { id: "pQT-18", content: "一对一沟通时，表达清晰、能促进了解", dimension: "说维度", type: "positive_talent", element: "说-能说出对方一听就明白的话 - 一对一" },
        { id: "pQT-19", content: "探讨问题时，常触动对方", dimension: "说维度", type: "positive_talent", element: "说-能说出对方一听就被启发的话 - 互动" },
        { id: "pQT-20", content: "公开分享观点时，能引发联想", dimension: "说维度", type: "positive_talent", element: "说-能说出对方一听就被启发的话 - 演说" }
      ]
    },
    {
      name: "做维度",
      questions: [
        { id: "pQT-21", content: "干喜欢的事，快而且结果超预期的好", dimension: "做维度", type: "positive_talent", element: "能把喜欢的事做得超出预期 - 短时间内能看到结果的" },
        { id: "pQT-22", content: "探索喜欢的事，能持续取得超预期成果", dimension: "做维度", type: "positive_talent", element: "能把喜欢的事做得超出预期 - 长周期才可能看到结果的" },
        { id: "pQT-23", content: "想干的事，又快又好，常能出意料外的结果", dimension: "做维度", type: "positive_talent", element: "能把结果导向的事做得超出预期 - 短期内能实现结果的" },
        { id: "pQT-24", content: "坚持的事，一步一步，不断出超预期成果", dimension: "做维度", type: "positive_talent", element: "能把结果导向的事做得超出预期 - 长周期能实现结果的" }
      ]
    },
    {
      name: "运动维度",
      questions: [
        { id: "pQT-25", content: "动中有变时，常能玩出花", dimension: "运动维度", type: "positive_talent", element: "运动-调节性好 - 变化中调节" },
        { id: "pQT-26", content: "动得飞快时，能玩出速度与激情", dimension: "运动维度", type: "positive_talent", element: "运动-调节性好 - 高速中调节" },
        { id: "pQT-27", content: "大变大动中，常能应变从容", dimension: "运动维度", type: "positive_talent", element: "运动-适应性强 - 快速适应" },
        { id: "pQT-28", content: "不断变动中，状态稳定持续", dimension: "运动维度", type: "positive_talent", element: "运动-适应性强 - 长期适应" }
      ]
    }
  ],
  negative_talent: [
    {
      name: "看维度",
      questions: [
        { id: "nQT-1", content: "遣词造句时，人的刻画也许会相对单调", dimension: "看维度", type: "negative_talent", element: "看-能发现有趣的点 - 人所展现的" },
        { id: "nQT-2", content: "遣词造句时，物的描述可能会略显粗糙", dimension: "看维度", type: "negative_talent", element: "看-能发现有趣的点 - 事/物所展现的" },
        { id: "nQT-3", content: "对发现身边人能用的点，看起来不太敏感", dimension: "看维度", type: "negative_talent", element: "看-能发现有用的点 - 人所具备的" },
        { id: "nQT-4", content: "对发现事/物有用的点，看起来缺乏意识", dimension: "看维度", type: "negative_talent", element: "看-能发现有用的点 - 事/物所具备的" }
      ]
    },
    {
      name: "听维度",
      questions: [
        { id: "nQT-5", content: "理解言辞语意需要时间", dimension: "听维度", type: "negative_talent", element: "听-能听出相同的点 - 熟悉内容" },
        { id: "nQT-6", content: "模仿发音小有挑战", dimension: "听维度", type: "negative_talent", element: "听-能听出相同的点 - 不熟悉内容" },
        { id: "nQT-7", content: "对认同与不认同，不容易反应过激", dimension: "听维度", type: "negative_talent", element: "听-能听出不同的点 - 需理解内容" },
        { id: "nQT-8", content: "音声辨识度相对低", dimension: "听维度", type: "negative_talent", element: "听-能听出不同的点 - 不需理解内容" }
      ]
    },
    {
      name: "记维度",
      questions: [
        { id: "nQT-9", content: "情感感知度暂时有些低", dimension: "记维度", type: "negative_talent", element: "记-能记住有意义的内容 - 印象深刻的内容" },
        { id: "nQT-10", content: "探求新知的意识暂时不那么强烈", dimension: "记维度", type: "negative_talent", element: "记-能记住有意义的内容 - 得到启发的内容" },
        { id: "nQT-11", content: "价值驱动记忆的情形暂时不明显", dimension: "记维度", type: "negative_talent", element: "记-能记住有价值的内容 - 马上要用到" },
        { id: "nQT-12", content: "能自然而然记住未来能用的、有价值内容的潜力尚未凸显", dimension: "记维度", type: "negative_talent", element: "记-能记住有价值的内容 - 将来能用到" }
      ]
    },
    {
      name: "想维度",
      questions: [
        { id: "nQT-13", content: "暂时未显现出奇特可行的创意能力", dimension: "想维度", type: "negative_talent", element: "想-能想到奇特的点子 - 可预见实现时间" },
        { id: "nQT-14", content: "暂时未见天马行空的奇特创意能力", dimension: "想维度", type: "negative_talent", element: "想-能想到奇特的点子 - 不可预见实现时间" },
        { id: "nQT-15", content: "马上能用的实用点子还不多见", dimension: "想维度", type: "negative_talent", element: "想-能想到实用的点子 - 马上能用" },
        { id: "nQT-16", content: "琢磨以后能用的实用点子暂时还不擅长", dimension: "想维度", type: "negative_talent", element: "想-能想到实用的点子 - 以后能用" }
      ]
    },
    {
      name: "说维度",
      questions: [
        { id: "nQT-17", content: "人多时不排除表达有点啰嗦", dimension: "说维度", type: "negative_talent", element: "说-能说出对方一听就明白的话 - 多人沟通" },
        { id: "nQT-18", content: "一对一沟通时，不排除说话有点儿绕", dimension: "说维度", type: "negative_talent", element: "说-能说出对方一听就明白的话 - 一对一" },
        { id: "nQT-19", content: "探讨问题时，比较少让人觉得被启发", dimension: "说维度", type: "negative_talent", element: "说-能说出对方一听就被启发的话 - 互动" },
        { id: "nQT-20", content: "表达可能会平平无奇，较少形象生动的表情或动作", dimension: "说维度", type: "negative_talent", element: "说-能说出对方一听就被启发的话 - 演说" }
      ]
    },
    {
      name: "做维度",
      questions: [
        { id: "nQT-21", content: "做喜欢的事时，短期快速出好结果的能力似乎还需加强", dimension: "做维度", type: "negative_talent", element: "能把喜欢的事做得超出预期 - 短时间内能看到结果的" },
        { id: "nQT-22", content: "做喜欢的事时，长期持续出好结果的能力似乎还可以提升", dimension: "做维度", type: "negative_talent", element: "能把喜欢的事做得超出预期 - 长周期才可能看到结果的" },
        { id: "nQT-23", content: "想干的事，高效干好的能力可以继续强化", dimension: "做维度", type: "negative_talent", element: "能把结果导向的事做得超出预期 - 短期内能实现结果的" },
        { id: "nQT-24", content: "要干的事，持续做出好结果的能力可以继续加强", dimension: "做维度", type: "negative_talent", element: "能把结果导向的事做得超出预期 - 长周期能实现结果的" }
      ]
    },
    {
      name: "运动维度",
      questions: [
        { id: "nQT-25", content: "充满变化的活动中，显得呆萌", dimension: "运动维度", type: "negative_talent", element: "运动-调节性好 - 变化中调节" },
        { id: "nQT-26", content: "高速推进的活动中，有点儿慢热", dimension: "运动维度", type: "negative_talent", element: "运动-调节性好 - 高速中调节" },
        { id: "nQT-27", content: "面对不断变化的环境，有些措手不及", dimension: "运动维度", type: "negative_talent", element: "运动-适应性强 - 快速适应" },
        { id: "nQT-28", content: "面对长期不适应的环境，有些无能为力", dimension: "运动维度", type: "negative_talent", element: "运动-适应性强 - 长期适应" }
      ]
    }
  ]
};

// 获取问题的工具函数（最终版）
export const getQuestionsByType = (type: Question['type']): Question[] => {
  return dimensions[type].flatMap(dimension => 
    dimension.questions.map(question => ({
      ...question,
      type // 确保类型一致性
    }))
  );
}; 