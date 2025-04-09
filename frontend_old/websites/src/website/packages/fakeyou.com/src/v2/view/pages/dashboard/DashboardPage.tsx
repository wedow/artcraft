import React from "react";
import Dashboard from "../landing/Dashboard";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Container } from "components/common";

export default function DashboardPage() {
  usePrefixedDocumentTitle("AI Tools");

  return (
    <Container type="panel">
      <Dashboard />
    </Container>
  );
}
