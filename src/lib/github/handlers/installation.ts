import { prisma } from "@/lib/prisma";
import { syncHistoricalData } from "@/lib/github/sync";

interface InstallationPayload {
  action: string;
  installation: {
    id: number;
    account: {
      login: string;
      type: string;
      avatar_url: string;
    };
  };
  sender: {
    id: number;
    login: string;
    avatar_url: string;
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
}

export async function handleInstallationEvent(payload: InstallationPayload) {
  const { action, installation: ghInstall } = payload;

  switch (action) {
    case "created": {
      const installation = await prisma.installation.upsert({
        where: { githubInstallId: ghInstall.id },
        update: {
          accountLogin: ghInstall.account.login,
          accountType: ghInstall.account.type,
          accountAvatarUrl: ghInstall.account.avatar_url,
          suspended: false,
        },
        create: {
          githubInstallId: ghInstall.id,
          accountLogin: ghInstall.account.login,
          accountType: ghInstall.account.type,
          accountAvatarUrl: ghInstall.account.avatar_url,
        },
      });

      // Create repositories
      if (payload.repositories) {
        await Promise.all(
          payload.repositories.map((repo) =>
            prisma.repository.upsert({
              where: { githubId: repo.id },
              update: {
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
              },
              create: {
                githubId: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                installationId: installation.id,
              },
            })
          )
        );
      }

      // Create member record for the user who installed the app
      if (payload.sender) {
        const user = await prisma.user.upsert({
          where: { githubId: payload.sender.id },
          update: {
            login: payload.sender.login,
            avatarUrl: payload.sender.avatar_url,
          },
          create: {
            githubId: payload.sender.id,
            login: payload.sender.login,
            avatarUrl: payload.sender.avatar_url,
          },
        });

        await prisma.member.upsert({
          where: {
            userId_installationId: {
              userId: user.id,
              installationId: installation.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            installationId: installation.id,
            role: "admin",
          },
        });
      }

      // Trigger historical data sync (fire and forget)
      syncHistoricalData(ghInstall.id, installation.id).catch((err) =>
        console.error("Historical sync failed:", err)
      );
      break;
    }

    case "deleted": {
      await prisma.installation.deleteMany({
        where: { githubInstallId: ghInstall.id },
      });
      break;
    }

    case "suspend": {
      await prisma.installation.updateMany({
        where: { githubInstallId: ghInstall.id },
        data: { suspended: true },
      });
      break;
    }

    case "unsuspend": {
      await prisma.installation.updateMany({
        where: { githubInstallId: ghInstall.id },
        data: { suspended: false },
      });
      break;
    }
  }
}

interface InstallationRepositoriesPayload {
  action: string;
  installation: { id: number };
  repositories_added?: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  repositories_removed?: Array<{ id: number }>;
}

export async function handleInstallationRepositoriesEvent(
  payload: InstallationRepositoriesPayload
) {
  const installation = await prisma.installation.findUnique({
    where: { githubInstallId: payload.installation.id },
  });

  if (!installation) return;

  if (payload.repositories_added) {
    await Promise.all(
      payload.repositories_added.map((repo) =>
        prisma.repository.upsert({
          where: { githubId: repo.id },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
          },
          create: {
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            installationId: installation.id,
          },
        })
      )
    );
  }

  if (payload.repositories_removed) {
    await prisma.repository.deleteMany({
      where: {
        githubId: { in: payload.repositories_removed.map((r) => r.id) },
      },
    });
  }
}
