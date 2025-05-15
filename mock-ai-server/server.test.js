/**
 * モックAIサーバーのテスト
 */

const request = require('supertest');
const express = require('express');

// テスト対象のサーバーをインポート
// 注: サーバーがlistenを実行しないようにモジュールを修正する必要がある
// 実際のテスト実行時はサーバーコードを分割し、Expressアプリだけをexportする形式が良い

// 簡易テスト - サーバーが正常に動作している場合のみ実行
describe('モックAIサーバーテスト', () => {
  const BASE_URL = 'http://localhost:3001';
  
  // サーバーが起動していることを前提とするテスト
  test('サーバーが起動していてルートエンドポイントが応答する', async () => {
    try {
      const response = await request(BASE_URL).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
    } catch (error) {
      console.error('テスト失敗: サーバーが起動していない可能性があります');
      throw error;
    }
  });
  
  test('テキスト生成エンドポイントが応答する', async () => {
    try {
      const testData = {
        model: 'text-basic-v1',
        prompt: 'これはテスト用のプロンプトです',
        max_tokens: 100,
        temperature: 0.7
      };
      
      const response = await request(BASE_URL)
        .post('/v1/completions')
        .send(testData);
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('choices');
      expect(response.body.choices[0]).toHaveProperty('text');
      expect(response.body).toHaveProperty('usage');
    } catch (error) {
      console.error('テスト失敗: サーバーが起動していない可能性があります');
      throw error;
    }
  });
  
  test('画像生成エンドポイントが応答する', async () => {
    try {
      const testData = {
        model: 'image-basic-v1',
        prompt: 'テスト用の画像を生成',
        n: 1,
        size: '512x512'
      };
      
      const response = await request(BASE_URL)
        .post('/v1/images/generations')
        .send(testData);
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('url');
    } catch (error) {
      console.error('テスト失敗: サーバーが起動していない可能性があります');
      throw error;
    }
  });
});
