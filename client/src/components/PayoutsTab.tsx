import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function PayoutsTab() {
  const [loading, setLoading] = useState(false);

  // Query to get status
  const statusQuery = trpc.creator.getStripeConnectStatus.useQuery();

  // Mutations
  const setupMutation = trpc.creator.stripeConnectSetup.useMutation();
  const loginLinkMutation = trpc.creator.getStripeLoginLink.useMutation();

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await setupMutation.mutateAsync({
        origin: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("Não foi possível gerar a URL de onboarding da Stripe.");
      }
    } catch (error) {
      console.error("Error setting up Connect:", error);
      toast.error("Ocorreu um erro ao configurar o Stripe Connect.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = async () => {
    setLoading(true);
    try {
      const result = await loginLinkMutation.mutateAsync();
      if (result.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error("Não foi possível gerar o link de login da Stripe.");
      }
    } catch (error) {
      console.error("Error getting login link:", error);
      toast.error("Ocorreu um erro ao abrir a dashboard do Stripe.");
    } finally {
      setLoading(false);
    }
  };

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </CardContent>
      </Card>
    );
  }

  const { connected, active, accountId } = statusQuery.data || { connected: false, active: false };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif tracking-wide">Payouts & Faturamento</h2>
        <p className="text-muted-foreground mt-1">
          Configure sua conta Stripe Connect Express para receber as assinaturas dos seus patronos de forma direta e automática.
        </p>
      </div>

      {!connected || !active ? (
        <Card className="border-red-900/30 bg-red-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <div>
                <CardTitle className="font-serif">Payouts Desativados</CardTitle>
                <CardDescription>
                  Sua conta de pagamentos não está configurada ou o onboarding está pendente.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para começar a receber pagamentos dos patronos na OnlyFangs, você precisa conectar uma conta da Stripe. 
              Ao se cadastrar, você informará sua conta bancária de preferência para receber os valores das assinaturas mensais.
            </p>
            <div className="bg-muted/40 p-4 rounded-lg border border-border/50 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Taxa da Plataforma:</span>
                <span className="font-semibold text-primary">10%</span>
              </div>
              <div className="flex justify-between">
                <span>Repasse Líquido p/ Criador:</span>
                <span className="font-semibold text-green-500">90%</span>
              </div>
              <div className="flex justify-between">
                <span>Frequência de Payout:</span>
                <span className="font-semibold">Automático (Configurado na Stripe)</span>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={loading || setupMutation.isPending}
              className="w-full md:w-auto font-semibold gap-2"
            >
              {(loading || setupMutation.isPending) && <Loader2 className="animate-spin" size={16} />}
              {connected ? "Concluir Onboarding da Stripe" : "Conectar Conta Stripe"}
              <ExternalLink size={16} />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-900/30 bg-green-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={24} />
              <div>
                <CardTitle className="font-serif">Payouts Configurados e Ativos</CardTitle>
                <CardDescription>
                  Sua conta Stripe Connect está ativa e você está pronto para receber repasses.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                ID da Conta Stripe: <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">{accountId}</code>
              </p>
              <p>Status de Transações: <span className="text-green-500 font-semibold">Ativo</span></p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              O repasse das assinaturas (90% do valor bruto) é enviado diretamente à sua conta bancária configurada na Stripe.
              Você pode visualizar seu saldo acumulado, editar seus dados bancários e gerenciar extratos clicando no botão abaixo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleGoToDashboard}
                disabled={loading || loginLinkMutation.isPending}
                className="font-semibold gap-2"
              >
                {(loading || loginLinkMutation.isPending) && <Loader2 className="animate-spin" size={16} />}
                Ver Painel Stripe Express
                <ExternalLink size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
