import { Component, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
const { startupCode } = require('../lib/startup-diagnostics.cjs');
type Props = { visible: boolean; onClose: () => void; browse?: boolean };

class PortalBoundary extends Component<{ onClose: () => void; children: ReactNode }, { code: string }> {
  state = { code: '' };
  static getDerivedStateFromError(error: unknown) { return { code: startupCode(error) }; }
  render() {
    if (!this.state.code) return this.props.children;
    return <Modal visible onRequestClose={this.props.onClose} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#F5F4EE', padding: 28, justifyContent: 'center', gap: 18 }}>
        <Text style={{ fontSize: 22, textAlign: 'center', color: '#163B39' }}>صفحة الدخول مقدرتش تفتح</Text>
        <Text selectable style={{ fontSize: 16, textAlign: 'center', color: '#163B39' }}>
          {`SU+ 1.14.1\n${this.state.code}\nبياناتك المحفوظة زي ما هي. اقفل الأبلكيشن وافتحه تاني.`}
        </Text>
        <Pressable onPress={this.props.onClose} accessibilityRole="button" style={{ padding: 18, backgroundColor: '#216B61', borderRadius: 18 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>رجوع للتطبيق</Text>
        </Pressable>
      </View>
    </Modal>;
  }
}
function LoadPortal(props: Props) {
  // Literal require is bundled by Metro, but evaluated only when the user opens the modal.
  // No WebView/SSO module initialization is needed just to show the login/home screen.
  const { PortalModal } = require('./portal-modal') as typeof import('./portal-modal');
  return <PortalModal {...props} />;
}
export function PortalModal(props: Props) {
  if (!props.visible) return null;
  return <PortalBoundary onClose={props.onClose}><LoadPortal {...props} /></PortalBoundary>;
}