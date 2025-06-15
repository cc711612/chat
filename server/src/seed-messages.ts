import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MessagesService } from './messages/messages.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const messagesService = app.get(MessagesService);

  console.log('開始新增聊天室 ID 1 的假資料...');

  // 用戶 1 發送的訊息
  const user1Messages = [
    '大家好，這是聊天室 1',
    '我是用戶 1，很高興認識大家',
    '今天天氣真好',
    '有人在嗎？',
    '這個聊天室功能真不錯',
    '我們可以討論任何話題',
    '希望大家都能積極參與',
    '分享一下你們的想法吧',
    '這個專案開發得如何了？',
    '我們需要再開一次會議嗎？',
    '下週的計劃是什麼？',
    '我已經完成了我的部分',
    '有任何問題可以隨時問我',
    '我們應該設定一個截止日期',
    '大家對這個設計有什麼意見？',
    '我覺得我們可以改進一些地方',
    '這個功能還需要更多測試',
    '我們需要更多的用戶反饋',
    '我很期待看到最終結果',
    '讓我們繼續努力吧',
  ];

  // 用戶 2 發送的訊息
  const user2Messages = [
    '你好，我是用戶 2',
    '很高興加入這個聊天室',
    '我剛剛看到你的訊息',
    '是的，今天天氣確實不錯',
    '我在這裡',
    '同意，這個聊天功能做得很好',
    '我喜歡討論技術相關的話題',
    '我有一些想法想分享',
    '專案進展順利',
    '我認為我們下週應該再開一次會',
    '我的計劃是完成前端部分',
    '太好了，你完成得很快',
    '我有一些關於設計的問題',
    '截止日期定在月底如何？',
    '我覺得設計很好，但可以再簡化一些',
    '我同意需要改進',
    '我可以幫忙做測試',
    '我已經收集了一些用戶反饋',
    '我也很期待',
    '加油！',
  ];

  // 生成隨機的發送時間
  const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // 從一週前開始
  const endDate = new Date(); // 到現在

  // 為用戶 1 新增訊息
  for (let i = 0; i < user1Messages.length; i++) {
    const sentAt = generateRandomDate(startDate, endDate);
    try {
      await messagesService.create(user1Messages[i], 1, 1, false, sentAt);
      console.log(`用戶 1 訊息 ${i + 1} 新增成功`);
    } catch (error) {
      console.error(`新增用戶 1 訊息 ${i + 1} 失敗:`, error.message);
    }
  }

  // 為用戶 2 新增訊息
  for (let i = 0; i < user2Messages.length; i++) {
    const sentAt = generateRandomDate(startDate, endDate);
    try {
      await messagesService.create(user2Messages[i], 1, 2, false, sentAt);
      console.log(`用戶 2 訊息 ${i + 1} 新增成功`);
    } catch (error) {
      console.error(`新增用戶 2 訊息 ${i + 1} 失敗:`, error.message);
    }
  }

  // 新增一些系統訊息
  const systemMessages = [
    '用戶 1 加入了聊天室',
    '用戶 2 加入了聊天室',
    '聊天室設置已更新',
  ];

  for (let i = 0; i < systemMessages.length; i++) {
    const sentAt = generateRandomDate(startDate, endDate);
    try {
      await messagesService.create(systemMessages[i], null as any, 1, true, sentAt);
      console.log(`系統訊息 ${i + 1} 新增成功`);
    } catch (error) {
      console.error(`新增系統訊息 ${i + 1} 失敗:`, error.message);
    }
  }

  console.log('假資料新增完成！');
  await app.close();
}

bootstrap();
