//중복입력해야하는 부분 모듈화

// 접근 정보를 변수로 저장
let SUPABASE_URL = 'https://kjbepvkviayjvylekrif.supabase.co';
let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmVwdmt2aWF5anZ5bGVrcmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODk1OTUsImV4cCI6MjA3ODE2NTU5NX0.vpV9W3iLSuMZ3KVOLgf0vj6CPeNHGqGOnsleMOSJgvA';

// Supabase 클라이언트를 생성한다
let client = supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);