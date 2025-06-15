import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MessagesService } from './messages/messages.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const messagesService = app.get(MessagesService);

  console.log('開始新增更多聊天室 ID 1 的假資料...');

  // 用戶 1 發送的更多訊息
  const user1MoreMessages = [
    '我們應該討論一下新功能的實現方式',
    '我認為我們可以使用 React Hooks 來優化程式碼',
    '最近有看到一個很棒的前端框架',
    '後端 API 的效能還需要再優化',
    '資料庫查詢速度有點慢',
    '我們需要增加更多的單元測試',
    '程式碼覆蓋率應該要達到 80% 以上',
    '我已經修復了幾個 bug',
    '新的設計稿看起來很不錯',
    '使用者體驗是我們的首要考量',
    '我們應該加入更多的動畫效果',
    '響應式設計還需要再調整',
    '移動版的排版有些問題',
    '我們需要支援更多的瀏覽器',
    '安全性問題需要優先處理',
    '我們應該實作 JWT 認證',
    '資料加密也是必要的',
    '用戶資料保護很重要',
    '我們需要遵守 GDPR 規範',
    '效能監控系統也應該要建立',
    '系統監控對於維護很重要',
    '我們需要一個好的日誌系統',
    '錯誤追蹤應該要更完善',
    '自動化測試可以節省很多時間',
    '持續整合和部署是必要的',
    '我們應該使用 Docker 來部署',
    'Kubernetes 可以幫助我們擴展服務',
    '雲端服務可以降低成本',
    '我們需要考慮多區域部署',
    '高可用性是關鍵',
    '災難恢復計劃也很重要',
    '我們應該定期進行備份',
    '資料遷移策略需要制定',
    '版本控制很重要',
    '我們應該遵循 Git Flow',
    '程式碼審查是必要的',
    '我們需要更多的文檔',
    'API 文檔應該要更新',
    '使用者手冊也需要編寫',
    '我們應該有更好的溝通工具',
    '團隊協作很重要',
    '我們需要定期開會討論進度',
    '敏捷開發方法論可以幫助我們',
    '我們應該使用看板來追蹤任務',
    '每日站立會議很有效',
    '我們需要更好的任務分配方式',
    '優先級管理很重要',
    '時間估算需要更準確',
    '我們應該設定明確的里程碑',
    '專案計劃需要更新',
  ];

  // 用戶 2 發送的更多訊息
  const user2MoreMessages = [
    '同意，我們應該好好討論新功能',
    'React Hooks 確實可以讓程式碼更簡潔',
    '哪個框架？可以分享一下嗎？',
    '我可以幫忙優化後端 API',
    '我們可以使用索引來加速查詢',
    '我已經開始寫一些單元測試了',
    '80% 的覆蓋率有點難，但我們可以試試',
    '太好了，謝謝你修復這些 bug',
    '設計稿在哪裡可以看到？',
    '同意，使用者體驗是最重要的',
    '動畫效果要適當，不要過度',
    '我可以幫忙調整響應式設計',
    '我會檢查移動版的問題',
    '我們應該優先支援主流瀏覽器',
    '我有一些安全性方面的建議',
    'JWT 認證已經在實作中了',
    '我們可以使用 AES 加密',
    '我們需要一個隱私政策頁面',
    'GDPR 合規是必要的',
    '我可以設置 Prometheus 來監控效能',
    'Grafana 可以用來視覺化監控數據',
    'ELK Stack 是個不錯的日誌系統選擇',
    '我們可以使用 Sentry 來追蹤錯誤',
    'Jest 和 Cypress 是不錯的測試工具',
    'Jenkins 或 GitHub Actions 都可以用於 CI/CD',
    '我已經準備好了 Docker 配置',
    '我有 Kubernetes 的經驗，可以幫忙',
    'AWS 或 GCP 都是不錯的選擇',
    '多區域部署需要考慮數據同步問題',
    '我們可以使用負載平衡器來提高可用性',
    '我們應該有一個完整的災難恢復計劃',
    '自動備份是必要的',
    '我可以幫忙制定資料遷移策略',
    '我們應該使用語義化版本控制',
    'Git Flow 確實很適合我們的團隊',
    '我會認真進行程式碼審查',
    '我可以幫忙寫一些文檔',
    '我們可以使用 Swagger 來生成 API 文檔',
    '使用者手冊應該要簡單易懂',
    'Slack 和 Discord 都是不錯的溝通工具',
    '團隊協作需要每個人的參與',
    '我會準時參加所有會議',
    '敏捷開發可以幫助我們快速迭代',
    'Trello 或 Jira 都可以用來管理看板',
    '站立會議應該控制在 15 分鐘以內',
    '我可以幫忙分配一些任務',
    '我們應該使用 MoSCoW 方法來管理優先級',
    '我會盡量準確估算時間',
    '里程碑應該要有明確的交付物',
    '我可以幫忙更新專案計劃',
  ];

  // 生成隨機的發送時間
  const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // 從一個月前開始
  const endDate = new Date(); // 到現在

  // 為用戶 1 新增更多訊息
  for (let i = 0; i < user1MoreMessages.length; i++) {
    const sentAt = generateRandomDate(startDate, endDate);
    try {
      await messagesService.create(user1MoreMessages[i], 1, 1, false, sentAt);
      console.log(`用戶 1 額外訊息 ${i + 1} 新增成功`);
    } catch (error) {
      console.error(`新增用戶 1 額外訊息 ${i + 1} 失敗:`, error.message);
    }
  }

  // 為用戶 2 新增更多訊息
  for (let i = 0; i < user2MoreMessages.length; i++) {
    const sentAt = generateRandomDate(startDate, endDate);
    try {
      await messagesService.create(user2MoreMessages[i], 2, 1, false, sentAt);
      console.log(`用戶 2 額外訊息 ${i + 1} 新增成功`);
    } catch (error) {
      console.error(`新增用戶 2 額外訊息 ${i + 1} 失敗:`, error.message);
    }
  }

  // 新增一些額外的系統訊息
  const extraSystemMessages = [
    '系統維護通知：將於明天凌晨 2 點進行系統維護',
    '聊天室功能已更新，新增了訊息分頁載入功能',
    '用戶 3 加入了聊天室',
    '用戶 3 離開了聊天室',
    '聊天室主題已更改',
    '聊天室已開啟通知功能',
    '系統已自動清理過期訊息',
    '聊天室權限已更新',
    '系統安全更新已完成',
    '聊天室已啟用端對端加密功能'
  ];

  for (let i = 0; i < extraSystemMessages.length; i++) {
    const sentAt = generateRandomDate(startDate, endDate);
    try {
      await messagesService.create(extraSystemMessages[i], null as any, 1, true, sentAt);
      console.log(`額外系統訊息 ${i + 1} 新增成功`);
    } catch (error) {
      console.error(`新增額外系統訊息 ${i + 1} 失敗:`, error.message);
    }
  }

  console.log('更多假資料新增完成！');
  await app.close();
}

bootstrap();
