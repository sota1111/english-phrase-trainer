import { PhraseInput } from '@/types/phrase';

/**
 * Initial phrase dataset for SOT-823.
 *
 * Source: Linear SOT-823 ("english-phrase-trainerの初期フレーズ登録と機能改善").
 * Three groups are mapped onto the `PhraseInput` model:
 *   - `category: 'word'`       — vocabulary (単語)
 *   - `category: 'expression'` — fixed business expressions / sentences (定型表現)
 *   - `category: 'pattern'`    — high-value sentence patterns (覚える価値が高い言い回し)
 *
 * `difficulty: 'hard'` marks the 10 priority items the issue calls out for
 * memorization first. `phrase` values are unique across the whole array so the
 * seed step can dedupe by phrase text and stay idempotent.
 *
 * Apostrophes are normalized to ASCII (') for consistency in code.
 */
export const initialPhrases: PhraseInput[] = [
  // ── 単語 (words) ──────────────────────────────────────────────
  { phrase: 'set up', meaningJa: '設定する、準備する', example: '', exampleJa: '', category: 'word', memo: '動詞は2語', difficulty: 'normal' },
  { phrase: 'setup', meaningJa: '設定、構成', example: '', exampleJa: '', category: 'word', memo: '名詞・形容詞', difficulty: 'normal' },
  { phrase: 'verify', meaningJa: '正しいか検証する', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'confirm', meaningJa: '事実・予定・状態を確認する', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'check', meaningJa: '軽く確認する', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'resolve', meaningJa: '問題を解決する', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'issue', meaningJa: '問題、不具合', example: '', exampleJa: '', category: 'word', memo: '仕事では problem より自然なことが多い', difficulty: 'normal' },
  { phrase: 'available', meaningJa: '都合がつく、利用可能', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'via', meaningJa: '〜経由で', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'remotely', meaningJa: 'リモートで', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'configuration', meaningJa: '設定、構成', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'environment', meaningJa: '環境', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'initial state', meaningJa: '初期状態', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'branch', meaningJa: 'Gitのブランチ', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'build', meaningJa: 'ビルドする、ビルド', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'bypass', meaningJa: '回避する、迂回する', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'host network', meaningJa: 'ホスト側ネットワーク', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'assign', meaningJa: '割り当てる', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'invitation', meaningJa: '招待', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'take care of', meaningJa: '対応する、処理する', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'rationale', meaningJa: '理由、根拠', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'current', meaningJa: '現在の', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },
  { phrase: 'additional', meaningJa: '追加の', example: '', exampleJa: '', category: 'word', memo: '', difficulty: 'normal' },

  // ── 定型表現 (fixed expressions) ──────────────────────────────
  { phrase: 'I will set up the client PCs today.', meaningJa: '今日、クライアントPCを設定します', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'I will set up six client PCs.', meaningJa: '6台のPCを設定します', example: '', exampleJa: '', category: 'expression', memo: '優先暗記', difficulty: 'hard' },
  { phrase: 'The setup has been completed on our side.', meaningJa: 'こちら側の設定は完了しました', example: '', exampleJa: '', category: 'expression', memo: '優先暗記 / on our side', difficulty: 'hard' },
  { phrase: 'Could you please check the setup?', meaningJa: '設定を確認してください', example: '', exampleJa: '', category: 'expression', memo: '優先暗記 / Could you please ... ?', difficulty: 'hard' },
  { phrase: 'Could you please verify the setup?', meaningJa: '設定を検証してください', example: '', exampleJa: '', category: 'expression', memo: '優先暗記 / Could you please ... ?', difficulty: 'hard' },
  { phrase: 'Please check the RMF settings.', meaningJa: 'RMF設定を確認してください', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'I cannot operate any robots.', meaningJa: 'ロボットを操作できません', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'I have connected six Windows PCs.', meaningJa: '6台のWindows PCを接続しました', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'All PCs are controlled via RustDesk.', meaningJa: 'すべてのPCはRustDesk経由で操作されます', example: '', exampleJa: '', category: 'expression', memo: '優先暗記', difficulty: 'hard' },
  { phrase: "Please contact me when you're available.", meaningJa: '都合がつく時に連絡してください', example: '', exampleJa: '', category: 'expression', memo: '優先暗記', difficulty: 'hard' },
  { phrase: 'Please resolve the issue via remote access.', meaningJa: 'リモートで問題を解決してください', example: '', exampleJa: '', category: 'expression', memo: 'via remote access', difficulty: 'normal' },
  { phrase: "Let me know when you're available to fix the issue remotely.", meaningJa: '問題をリモートで修正できる時に教えてください', example: '', exampleJa: '', category: 'expression', memo: '優先暗記 / Let me know when ...', difficulty: 'hard' },
  { phrase: 'After you confirm the invitation, please reply to me.', meaningJa: '招待を承認したら返信してください', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: "I'll assign you a Copilot seat.", meaningJa: 'Copilotのシートを割り当てます', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'If we start from the initial state, can we try RMF?', meaningJa: '初期状態から始める場合、RMFを試せますか？', example: '', exampleJa: '', category: 'expression', memo: 'from the initial state', difficulty: 'normal' },
  { phrase: 'Work done on this PC', meaningJa: 'このPCで実施したこと', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'Here is what I did on this PC.', meaningJa: 'このPCで実施した内容は以下です', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'This branch is for Ubuntu 24.04.', meaningJa: 'Ubuntu 24.04用のブランチです', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'I believe we should use docker compose.', meaningJa: 'docker composeを使うべきだと思います', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'This is the result without installing Python 3.12.', meaningJa: 'Python 3.12を入れずに実行した結果です', example: '', exampleJa: '', category: 'expression', memo: '優先暗記', difficulty: 'hard' },
  { phrase: 'Do you have any issues with the current Dockerfile?', meaningJa: '現在のDockerfileで問題がありますか？', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },
  { phrase: 'There is no need to add any additional commands.', meaningJa: '追加コマンドは不要です', example: '', exampleJa: '', category: 'expression', memo: '優先暗記 / there is no need to ...', difficulty: 'hard' },
  { phrase: 'It has already been taken care of.', meaningJa: 'すでに対応済みです', example: '', exampleJa: '', category: 'expression', memo: '', difficulty: 'normal' },

  // ── 覚える価値が高い言い回し (high-value patterns) ───────────────
  { phrase: 'The setup is complete on our side.', meaningJa: 'こちら側の設定は完了しています', example: '', exampleJa: '', category: 'pattern', memo: 'on our side', difficulty: 'normal' },
  { phrase: "Let me know when you're available.", meaningJa: '都合がつく時に教えてください', example: '', exampleJa: '', category: 'pattern', memo: 'Let me know when ...', difficulty: 'normal' },
  { phrase: 'Please check the PC via remote access.', meaningJa: 'リモートアクセスでそのPCを確認してください', example: '', exampleJa: '', category: 'pattern', memo: 'via remote access', difficulty: 'normal' },
  { phrase: 'Can we start from the initial state?', meaningJa: '初期状態から始められますか？', example: '', exampleJa: '', category: 'pattern', memo: 'from the initial state', difficulty: 'normal' },
  { phrase: 'There is no need to install Python 3.12.', meaningJa: 'Python 3.12をインストールする必要はありません', example: '', exampleJa: '', category: 'pattern', memo: 'there is no need to ...', difficulty: 'normal' },
  { phrase: "Use the host network instead of Docker's virtual network.", meaningJa: 'Dockerの仮想ネットワークではなくホストネットワークを使ってください', example: '', exampleJa: '', category: 'pattern', memo: 'instead of ...', difficulty: 'normal' },
  { phrase: 'In my understanding, this should be implemented in the adapter.', meaningJa: '私の理解では、これはアダプタで実装すべきです', example: '', exampleJa: '', category: 'pattern', memo: 'in my understanding', difficulty: 'normal' },
  { phrase: 'Could you explain why this is implemented in the HIC main instead of the adapter?', meaningJa: 'なぜこれがアダプタではなくHIC mainで実装されているのか説明してもらえますか？', example: '', exampleJa: '', category: 'pattern', memo: 'Could you explain why ... ?', difficulty: 'normal' },
  { phrase: 'It has been tested in the Jazzy environment.', meaningJa: 'Jazzy環境でテスト済みです', example: '', exampleJa: '', category: 'pattern', memo: 'has been tested in ...', difficulty: 'normal' },
  { phrase: 'This Dockerfile is used to build the RMF-WEB components.', meaningJa: 'このDockerfileはRMF-WEBコンポーネントのビルドに使われます', example: '', exampleJa: '', category: 'pattern', memo: 'is used to ...', difficulty: 'normal' },
  { phrase: 'The coordinate translator should be implemented in the adapter.', meaningJa: '座標変換はアダプタで実装すべきです', example: '', exampleJa: '', category: 'pattern', memo: 'be implemented in ...', difficulty: 'normal' },

  // ── 優先暗記の追加分 (priority item not covered above) ──────────
  { phrase: 'Could you explain why this is implemented here instead of in the adapter?', meaningJa: 'なぜこれがアダプタではなくここで実装されているのか説明してもらえますか？', example: '', exampleJa: '', category: 'pattern', memo: '優先暗記 / Could you explain why ... ?', difficulty: 'hard' },
];
