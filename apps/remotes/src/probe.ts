import { createElement, useState, version } from "react";
import { createRoot } from "react-dom/client";

/**
 * 호스트가 공유 스코프 검증에 쓴다.
 *
 * 모듈 네임스페이스 객체는 MF 공유 래퍼를 거치면 다른 객체가 될 수 있어서
 * `===` 비교에 쓸 수 없다. 함수 자체의 동일성을 비교해야 "같은 React 인스턴스"가 증명된다.
 */
export const probe = {
  createElement,
  useState,
  createRoot,
  version,
};
