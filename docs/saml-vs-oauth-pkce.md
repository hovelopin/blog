# SAML SSO vs OAuth 2.0 Authorization Code + PKCE — 인증 표준 두 거인 deep dive

> 사내 서비스에 로그인 기능을 붙이려고 Azure Entra ID 를 들여다보면 두 가지 큰 갈래가 보입니다 — **엔터프라이즈 애플리케이션(주로 SAML)** 과 **앱 등록(OAuth 2.0/OIDC)**. 둘은 자주 같은 단어("SSO")로 묶이지만 설계 철학·내부 동작·적합한 사용처가 완전히 다릅니다. 이 글은 두 표준의 동작 원리를 흐름 단위로 풀어보고, **어느 상황에 무엇을 선택해야 하는지** 정리합니다.

---

## 0. 한 줄 요약

- **SAML 2.0**: 2005년에 표준화된 **XML 기반 엔터프라이즈 SSO 프로토콜**. 회사 직원 → 사내 SaaS(Workday, Salesforce) 로그인 통합용으로 최적화.
- **OAuth 2.0 + OIDC + PKCE**: 2012년 이후 만들어진 **JSON 기반 인증/인가 프로토콜 패밀리**. 웹·모바일·SPA·API 호출에 적합한 현대 표준.

> SSO 라는 단어 자체는 "한 번 로그인하면 여러 서비스에 자동으로 인증된다" 는 사용자 경험을 뜻하고, SAML 도 OAuth 도 모두 이 경험을 제공합니다. 차이는 **누가**, **어떤 데이터**를, **어떤 형식**으로 주고받느냐.

---

## 1. SAML 2.0 — 엔터프라이즈 SSO 의 클래식

### 1.1 등장 배경

- 2000년대 초 회사들이 사내 ID 한 개로 외부 SaaS(Salesforce, Workday 등) 에 로그인 시키고 싶어함
- OASIS 컨소시엄이 2005년 SAML 2.0 표준 발표
- 당시 표준 데이터 포맷은 XML — 그래서 SAML 도 XML 기반

### 1.2 핵심 등장인물

| 역할 | 약자 | 설명 |
|---|---|---|
| Identity Provider | **IdP** | 사용자의 신원을 보증하는 주체. Azure AD, Okta, ADFS, Google Workspace 등 |
| Service Provider | **SP** | 사용자가 접속하려는 서비스. Salesforce, Workday, 자체 SaaS 등 |
| Assertion | — | IdP 가 서명해서 SP 에게 "이 사용자는 진짜이다" 라고 알려주는 **XML 문서** |
| Assertion Consumer Service URL | **ACS URL** | SP 가 IdP 의 응답(SAML Response) 을 받기 위해 노출하는 엔드포인트 |
| Binding | — | SAML 메시지를 HTTP 로 전달하는 방식. `HTTP-POST`, `HTTP-Redirect`, `Artifact` |

### 1.3 흐름 — SP-Initiated Web Browser SSO

가장 흔한 시나리오. 사용자가 SP 의 보호 페이지에 직접 접근하는 경우.

```
┌────────┐                    ┌──────────┐                ┌───────┐
│ 사용자 │                    │ SP (앱)  │                │  IdP  │
└───┬────┘                    └────┬─────┘                └───┬───┘
    │                              │                          │
    │ 1. GET /protected-page       │                          │
    ├─────────────────────────────►│                          │
    │                              │                          │
    │ 2. 302 redirect to IdP       │                          │
    │    + SAMLRequest (압축·base64)                          │
    │◄─────────────────────────────┤                          │
    │                              │                          │
    │ 3. GET /idp/sso?SAMLRequest=...&RelayState=...          │
    ├─────────────────────────────────────────────────────────►│
    │                              │                          │
    │ 4. 로그인 화면 표시          │                          │
    │◄─────────────────────────────────────────────────────────┤
    │                              │                          │
    │ 5. POST /idp/login (자격증명)                            │
    ├─────────────────────────────────────────────────────────►│
    │                              │                          │
    │                              │ IdP 가 서명한 SAMLResponse 생성
    │                              │                          │
    │ 6. HTML form auto-submit     │                          │
    │    POST {SP_ACS_URL}         │                          │
    │    body: SAMLResponse=...    │                          │
    │◄─────────────────────────────────────────────────────────┤
    │                              │                          │
    │ 7. POST /acs (브라우저가 자동 submit)                    │
    │    body: SAMLResponse=...    │                          │
    ├─────────────────────────────►│                          │
    │                              │                          │
    │                              │ XML 서명 검증, 조건 확인,
    │                              │ Assertion 파싱, 세션 쿠키 발급
    │                              │                          │
    │ 8. 302 to /protected-page    │                          │
    │    Set-Cookie: session=...   │                          │
    │◄─────────────────────────────┤                          │
    │                              │                          │
```

### 1.4 SAMLRequest 안에는 뭐가 있나

```xml
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  ID="_abc123"
  Version="2.0"
  IssueInstant="2026-05-21T07:00:00Z"
  Destination="https://login.microsoftonline.com/.../saml2"
  AssertionConsumerServiceURL="https://app.example.com/acs"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://app.example.com</saml:Issuer>
  <samlp:NameIDPolicy
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"/>
</samlp:AuthnRequest>
```

- `ID` — 응답이 이 요청에 대한 것인지 매칭하는 식별자
- `Destination` — IdP 의 SSO 엔드포인트
- `AssertionConsumerServiceURL` — IdP 가 응답을 보낼 SP 의 URL
- `NameIDPolicy` — 어떤 형식의 사용자 식별자를 원하는지 (이메일, persistent, transient 등)

이 XML 을 **DEFLATE 압축 → base64 → URL-encode** 해서 query 로 전달.

### 1.5 SAMLResponse — 핵심

IdP 가 만들어서 사용자 브라우저를 통해 SP 의 ACS URL 로 **POST** 하는 XML.

```xml
<samlp:Response Destination="https://app.example.com/acs">
  <saml:Issuer>https://sts.windows.net/{tenant}/</saml:Issuer>
  <ds:Signature>...</ds:Signature>                    <!-- IdP 서명 -->
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion>
    <saml:Issuer>https://sts.windows.net/{tenant}/</saml:Issuer>
    <ds:Signature>...</ds:Signature>                  <!-- Assertion 서명 -->
    <saml:Subject>
      <saml:NameID Format="...emailAddress">harvey@polarisoffice.com</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData
          NotOnOrAfter="2026-05-21T07:05:00Z"
          Recipient="https://app.example.com/acs"
          InResponseTo="_abc123"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions
      NotBefore="2026-05-21T06:55:00Z"
      NotOnOrAfter="2026-05-21T07:55:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://app.example.com</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AttributeStatement>
      <saml:Attribute Name="email">
        <saml:AttributeValue>harvey@polarisoffice.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="displayName">
        <saml:AttributeValue>김하비</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="groups">
        <saml:AttributeValue>engineering</saml:AttributeValue>
        <saml:AttributeValue>admins</saml:AttributeValue>
      </saml:AttributeValue>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

### 1.6 SP 가 SAMLResponse 받았을 때 검증해야 하는 것

순서대로 **모두** 통과해야 안전:

1. `Destination` 이 우리 ACS URL 인가
2. `Status` 가 `Success` 인가
3. **XML 서명 (`<ds:Signature>`) 이 IdP 의 공개키로 검증되는가** ← 가장 중요. XML-DSig 표준
4. `InResponseTo` 가 우리가 보낸 SAMLRequest 의 ID 와 일치하는가 (XSW 공격 방지)
5. `Conditions.NotBefore` 와 `NotOnOrAfter` 사이 시각인가
6. `AudienceRestriction` 에 우리 SP entityID 가 포함되는가
7. `Subject.NameID` 에서 사용자 식별자 추출

> **XML 서명의 위험성**: SAML 의 대부분의 취약점(XSW, XXE, XML 폭탄 등) 은 XML-DSig 의 복잡성에서 옴. 직접 구현하지 말고 `xmlsec`, `python3-saml`, `passport-saml` 같은 검증된 라이브러리를 쓸 것.

### 1.7 IdP-Initiated SSO

사용자가 IdP 의 대시보드(예: Microsoft MyApps) 에서 앱 타일을 클릭해 시작하는 흐름. SP-Initiated 와 달리 SAMLRequest 가 없음 → `InResponseTo` 매칭 불가 → CSRF 류 공격에 노출되기 쉬워 권장되지 않음.

### 1.8 SAML 의 강점

- 엔터프라이즈 환경 검증된 표준 — 20년 가까이 다듬어짐
- 거의 모든 SaaS 가 SAML 연동을 기본 제공
- IdP 가 한 곳이라 **사용자 deprovisioning(퇴사·차단) 이 즉시 반영**
- 속성 기반 권한 전달 (`groups`, `roles` 등)

### 1.9 SAML 의 약점

- XML 파싱·서명 검증이 무겁고 취약점 빈도 높음
- 토큰 크기 큼 (수 KB) — 모바일·SPA 에 부적합
- API 호출 표준이 없음 (Bearer 토큰 개념 부재)
- Refresh token 없음 — 세션 만료 시 풀 로그인 다시
- 모바일 앱에서 SAML 처리는 매우 어색함

---

## 2. OAuth 2.0 + OIDC + PKCE — 현대 표준

### 2.1 OAuth 2.0 / OpenID Connect / PKCE 가 각각 뭔지

세 표준이 **층층이 쌓여** 있음:

| 표준 | 발표 | 역할 |
|---|---|---|
| OAuth 2.0 | RFC 6749 (2012) | **인가(Authorization)** 표준 — "이 사용자가 우리 앱이 X 리소스에 접근하는 걸 허락했다" |
| OpenID Connect (OIDC) | 2014 | OAuth 2.0 위에 **인증(Authentication)** 을 얹은 표준 — "이 사용자가 누구다(ID Token)" |
| PKCE | RFC 7636 (2015) | OAuth 2.0 의 Authorization Code 흐름을 **공개 클라이언트에서도 안전**하게 만든 확장 |

> **헷갈리기 쉬운 점**: OAuth 2.0 자체는 인증 표준이 아님. "로그인" 까지 하려면 OIDC 가 필요. 우리가 "OAuth 로그인" 이라고 부르는 건 거의 항상 OIDC.

### 2.2 핵심 등장인물

| 역할 | 설명 | SAML 대응 |
|---|---|---|
| Resource Owner | 사용자 | 사용자 |
| Client | 로그인을 요청하는 우리 앱 | SP |
| Authorization Server (AS) | 토큰을 발급하는 서버. 인증 화면을 보여줌 | IdP |
| Resource Server | access_token 으로 API 를 보호하는 서버 (예: Microsoft Graph) | — |
| User-Agent | 사용자의 브라우저 (또는 모바일 OS) | 사용자 브라우저 |

### 2.3 토큰 종류

| 토큰 | 형식 | 용도 | TTL |
|---|---|---|---|
| **Authorization Code** | 짧은 랜덤 문자열 | 토큰 교환용 일회성 코드 | ~10분 |
| **Access Token** | JWT 또는 opaque | API 호출 시 `Authorization: Bearer ...` | 보통 1시간 |
| **ID Token (OIDC)** | JWT | 사용자 신원 정보 (이메일, oid, tid 등) | 보통 1시간 |
| **Refresh Token** | opaque | 만료된 access_token 갱신용 | 길게 (며칠~수십일) |

### 2.4 흐름 — Authorization Code + PKCE (우리가 쓰는 방식)

```
┌────────┐                  ┌──────────┐               ┌──────────────┐
│ 사용자 │                  │ 우리앱   │               │ Microsoft AS │
└───┬────┘                  └────┬─────┘               └──────┬───────┘
    │                            │                            │
    │ 1. GET /login              │                            │
    ├───────────────────────────►│                            │
    │                            │                            │
    │                            │ 2. code_verifier 생성 (랜덤 32바이트)
    │                            │    code_challenge = SHA256(code_verifier)
    │                            │    state = 랜덤(CSRF)
    │                            │    nonce = 랜덤(replay 방지)
    │                            │    임시쿠키에 verifier/state/nonce 저장
    │                            │                            │
    │ 3. 302 to authorize URL    │                            │
    │◄───────────────────────────┤                            │
    │                            │                            │
    │ 4. GET /authorize?         │                            │
    │     client_id=...&         │                            │
    │     response_type=code&    │                            │
    │     redirect_uri=...&      │                            │
    │     scope=openid+profile+email+User.Read+offline_access&│
    │     state=...&             │                            │
    │     nonce=...&             │                            │
    │     code_challenge=...&    │                            │
    │     code_challenge_method=S256                          │
    ├────────────────────────────────────────────────────────►│
    │                            │                            │
    │ 5. 로그인 화면 (필요시 동의 화면)                       │
    │◄────────────────────────────────────────────────────────┤
    │                            │                            │
    │ 6. POST 자격증명           │                            │
    ├────────────────────────────────────────────────────────►│
    │                            │                            │
    │                            │      AS 는 code 발급 + challenge 저장
    │                            │                            │
    │ 7. 302 to redirect_uri?code=xxx&state=...               │
    │◄────────────────────────────────────────────────────────┤
    │                            │                            │
    │ 8. GET /auth/callback?code=xxx&state=...                │
    ├───────────────────────────►│                            │
    │                            │                            │
    │                            │ 9. state 검증 (쿠키와 비교)│
    │                            │                            │
    │                            │ 10. POST /token            │
    │                            │     grant_type=authorization_code
    │                            │     code=xxx               │
    │                            │     code_verifier=원본 verifier
    │                            │     client_id, client_secret
    │                            ├───────────────────────────►│
    │                            │                            │
    │                            │       AS: SHA256(verifier) == 저장된 challenge ?
    │                            │       client_secret 검증, code 만료 여부 등
    │                            │                            │
    │                            │ 11. { id_token, access_token, refresh_token }
    │                            │◄───────────────────────────┤
    │                            │                            │
    │                            │ 12. id_token JWT 서명을 JWKS 로 검증
    │                            │     iss/aud/exp/nonce 검증 │
    │                            │     사용자 정보 추출       │
    │                            │     자체 세션 쿠키 발급    │
    │                            │                            │
    │ 13. 302 to /               │                            │
    │     Set-Cookie: session=jwt│                            │
    │◄───────────────────────────┤                            │
```

### 2.5 ID Token 안에는 뭐가 있나

base64url 로 인코딩된 JWT 의 payload 부분을 디코딩하면:

```json
{
  "aud": "12345678-1234-1234-1234-123456789012",         // 우리 client_id
  "iss": "https://login.microsoftonline.com/{tid}/v2.0", // 발급자
  "iat": 1716278400,
  "nbf": 1716278400,
  "exp": 1716282000,
  "sub": "abc...xyz",          // pairwise identifier (앱 별 고유)
  "oid": "f0a4b1c2-...",       // Azure 사용자 고유 ID (tenant 안에서 stable)
  "tid": "9988-...",           // tenant ID
  "preferred_username": "harvey@polarisoffice.com",
  "name": "Harvey Kim",
  "email": "harvey@polarisoffice.com",
  "nonce": "xxx",              // 우리가 보낸 nonce — replay 방지
  "ver": "2.0"
}
```

### 2.6 PKCE 가 정확히 막는 것

**Authorization Code 인터셉트 공격(Authorization Code Interception Attack)** 을 막음.

#### PKCE 없는 흐름의 취약점

```
1. 모바일 앱이 /authorize 호출 → code=ABC 받음
2. 코드가 redirect_uri (예: myapp://callback?code=ABC) 로 돌아옴
3. 다른 악성 앱이 같은 URI scheme(myapp://) 등록해서 code 가로채기 가능
4. 악성 앱 → AS /token → ABC + client_id 만으로 토큰 획득 ✓ (client_secret 없음)
```

#### PKCE 가 추가하는 방어

```
1. 모바일 앱: code_verifier (랜덤) 생성 → code_challenge = SHA256(verifier)
2. /authorize 요청에 code_challenge 만 동봉
3. AS 는 code 발급하면서 code_challenge 도 함께 저장
4. /token 교환할 때 원본 verifier 를 보냄
5. AS: SHA256(verifier) == 저장된 challenge ?
   ✓ 일치 → 토큰 발급
   ✗ 불일치 → 거부
```

악성 앱이 `code` 를 가로채도 **원본 `verifier`** 를 모르기 때문에 토큰 교환 실패. `verifier` 는 처음 만든 클라이언트의 메모리/쿠키에만 존재.

#### 서버사이드(우리 같은 confidential client) 에도 PKCE 가 필요한가?

원칙적으로는 client_secret 이 있으니 코드 인터셉트만으로는 토큰 발급 불가능 → PKCE 불필요. 그래도 **추가하는 게 권장됨**:

- **방어층 추가** — client_secret 이 유출돼도 verifier 까지 알아야 하므로 한 단계 더
- **표준 통일** — OAuth 2.1 (다음 버전) 부터는 모든 클라이언트에 PKCE 필수
- **로그 안전성** — code 가 access log 나 referrer 등에 새도 verifier 없으면 무용

### 2.7 state, nonce 의 역할

| 파라미터 | 목적 | 검증 시점 |
|---|---|---|
| `state` | **CSRF 방지** — 우리가 시작한 흐름의 응답인지 확인 | callback 도착 시 쿠키와 비교 |
| `nonce` | **Replay 방지** — 같은 ID Token 재사용 차단 | id_token 검증 시 claim 의 nonce 와 쿠키 비교 |
| `code_verifier` | **Code 인터셉트 방지** | /token 교환 시 |

세 가지가 모두 있어야 안전한 OAuth 흐름이 됨.

### 2.8 OAuth/OIDC 의 강점

- 가볍고 빠름 (JSON/JWT)
- 모바일·SPA·웹 어디서나 일관된 흐름
- access_token 으로 **API 호출이 표준화**됨 (Microsoft Graph, Google APIs 등)
- refresh_token 으로 사용자 재로그인 없이 세션 유지
- Scope 로 fine-grained 권한 부여 (`Mail.Read`, `Calendars.ReadWrite` 등)
- OIDC Discovery (`/.well-known/openid-configuration`) 로 메타데이터 자동 발견
- JWT 서명 검증은 **JWKS endpoint + `jose` 한 줄**

### 2.9 OAuth/OIDC 의 약점

- 표준이 여러 갈래(implicit, code, device, client_credentials 등)라 학습 곡선 있음
- access_token 이 JWT 면 **revoke 가 어려움** (만료까지 살아있음)
- Refresh token 보관·rotation 정책을 직접 다뤄야 함

---

## 3. SAML vs OAuth/OIDC — 정면 비교

| 항목 | SAML 2.0 | OAuth 2.0 + OIDC + PKCE |
|---|---|---|
| 표준 발표 | 2005 | 2012 (OAuth), 2014 (OIDC), 2015 (PKCE) |
| 데이터 포맷 | XML | JSON / JWT |
| 토큰 크기 | 수 KB ~ 수십 KB | 보통 1~2 KB |
| 토큰 검증 | XML 서명 (XML-DSig) | JWT 서명 (HS256/RS256, JWKS) |
| 흐름 트리거 | SAMLRequest (XML, deflate+base64) | URL query parameters |
| 응답 전달 | HTML form POST 자동 submit | URL query / fragment |
| 인증/인가 | 둘 다 한 번에 | 인가(OAuth) + 인증(OIDC) 분리 |
| API 호출 표준 | 없음 (별도 표준 필요) | Bearer token (`Authorization` 헤더) |
| Refresh Token | 없음 | `offline_access` scope 로 발급 |
| 권한 모델 | Attribute Statement | Scope + claims |
| 모바일/SPA | 어색함 | 네이티브 지원 (PKCE) |
| 사용자 deprovisioning | IdP 한 곳에서 즉시 | refresh_token revoke + access_token 만료 대기 |
| 대표 사용처 | Workday, Salesforce, Tableau, Concur | Microsoft Graph, Google APIs, GitHub, 자체 웹앱 |
| Azure 메뉴 | 엔터프라이즈 애플리케이션 | 앱 등록 |

---

## 4. 언제 무엇을 골라야 하나

### SAML 을 골라야 할 때

- **기존 SaaS 와 SSO 통합** — 이미 SAML 만 지원하는 엔터프라이즈 SaaS (Workday, Tableau, Concur 등)
- **자체 코드를 작성하지 않는** 통합 — 갤러리 앱 클릭만으로 끝나는 경우
- **속성 기반 권한 전달** 이 핵심 — `groups`, `cost-center` 같은 사내 속성을 그대로 넘겨야 할 때

### OAuth 2.0 + OIDC + PKCE 를 골라야 할 때

- **자체 웹앱·모바일 앱** 을 만들어 인증을 붙일 때
- **외부 API**(Microsoft Graph, Google Calendar 등) **를 호출** 해야 할 때
- **SPA / 모바일** 처럼 client_secret 을 안전하게 보관 못 하는 환경
- **fine-grained scope** 권한이 필요한 경우 (Mail.Send 만 허용 등)
- **refresh token** 으로 장기 세션 유지가 필요한 경우

> 우리의 Polaris Office Skill Market 처럼 **자체 Next.js 앱 + 향후 Microsoft Graph 호출 가능성** 이 있는 경우는 **거의 무조건 OAuth + OIDC + PKCE**.

---

## 5. 실전 — 우리가 마켓플레이스에서 채택한 흐름

Polaris Office Skill Market 은 다음 조합을 사용합니다:

- **Authorization Server**: Microsoft Entra ID (Single tenant)
- **흐름**: Authorization Code + PKCE
- **Scope**: `openid profile email User.Read offline_access`
- **세션**: ID Token 검증 후 자체 JWT(HS256) 를 `HttpOnly` 쿠키로 발급 — 8시간 TTL
- **보호**: `proxy.ts` 에서 모든 비공개 경로를 가로채 쿠키 검증, 실패 시 `/login` 으로 redirect

### 라이브러리

- [`jose`](https://github.com/panva/jose) — JWT 검증·서명·JWKS fetch 모두 한 번에 처리. Edge runtime 호환.

### 핵심 코드 발췌

```ts
// /auth/login — PKCE 생성 후 Microsoft authorize URL 로 redirect
const codeVerifier = generateRandomString(64);
const codeChallenge = await sha256Base64Url(codeVerifier);
const state = generateRandomString();
const nonce = generateRandomString();

cookieStore.set("oauth_code_verifier", codeVerifier, { httpOnly: true, ... });
cookieStore.set("oauth_state", state, { ... });
cookieStore.set("oauth_nonce", nonce, { ... });

const authorizeUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
authorizeUrl.searchParams.set("code_challenge", codeChallenge);
authorizeUrl.searchParams.set("code_challenge_method", "S256");
// ... state, nonce, scope, redirect_uri 등 설정

return NextResponse.redirect(authorizeUrl);
```

```ts
// /auth/callback — code → token 교환 + ID token 검증
const tokenRes = await fetch(tokenEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    client_id, client_secret,
    redirect_uri,
  }),
});

const { id_token } = await tokenRes.json();
const jwks = createRemoteJWKSet(new URL(jwksUri));
const { payload } = await jwtVerify(id_token, jwks, {
  audience: clientId,
  issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
});

if (payload.nonce !== savedNonce) throw new Error("nonce mismatch");
// 자체 세션 JWT 발급 → HttpOnly 쿠키 저장
```

---

## 6. 마무리

| | SAML | OAuth/OIDC |
|---|---|---|
| 정체 | 엔터프라이즈 SSO 표준 | 인증+인가 패밀리 |
| 한 줄로 | "직원이 사내 SaaS 에 로그인" | "사용자가 우리 앱에서 무언가 할 수 있게 허락" |
| 우리가 쓸 곳 | 사내 SaaS 통합 (Workday 등) | 자체 앱 + API 호출 모두 |

**SSO 라는 같은 단어 안에 두 표준이 있다** 는 것만 알면 Azure Portal 의 메뉴 선택부터 라이브러리 선택까지 일관성 있는 결정이 가능합니다. 사내 SaaS 와의 통합이라면 엔터프라이즈 애플리케이션 + SAML, **자체 앱이라면 앱 등록 + OAuth 2.0 + OIDC + PKCE** 로 시작하면 됩니다.

---

## 참고

- [SAML 2.0 Core (OASIS)](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)
- [RFC 6749 — The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 — Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Microsoft identity platform - Authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
