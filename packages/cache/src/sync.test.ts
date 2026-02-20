const mockUpsert = jest.fn();

const mockDb = {
  upsert: mockUpsert,
};

import Sync from "./sync";

describe("Sync", () => {
  let sync: Sync;

  beforeEach(() => {
    sync = new Sync(mockDb, "test-key", "test-token");
    mockUpsert.mockReset();
    mockUpsert.mockResolvedValue(undefined);
  });

  describe("process", () => {
    it("processes board with organization successfully", async () => {
      const boardData = [
        {
          id: "board123",
          name: "Test Board",
          closed: false,
          idOrganization: "org123",
          idMemberCreator: "member123",
          shortLink: "test123",
          lists: [],
          cards: [],
          members: [],
          labels: [],
          organization: {
            id: "org123",
            displayName: "Test Org",
            idMemberCreator: "member123",
          },
        },
      ];

      await sync["process"](boardData);

      // Verify board was processed
      expect(mockUpsert).toHaveBeenCalledWith("boards", {
        id: "board123",
        name: "Test Board",
        orgId: "org123",
        creatorId: "member123",
        shortLink: "test123",
        closed: 0,
      });

      // Verify organization was processed
      expect(mockUpsert).toHaveBeenCalledWith("orgs", {
        id: "org123",
        displayName: "Test Org",
        creatorId: "member123",
      });
    });

    it("processes board without organization successfully", async () => {
      const boardData = [
        {
          id: "board456",
          name: "Personal Board",
          closed: false,
          idOrganization: null,
          idMemberCreator: "member456",
          shortLink: "personal123",
          lists: [],
          cards: [],
          members: [],
          labels: [],
          organization: null,
        },
      ];

      await sync["process"](boardData);

      // Verify board was processed
      expect(mockUpsert).toHaveBeenCalledWith("boards", {
        id: "board456",
        name: "Personal Board",
        orgId: null,
        creatorId: "member456",
        shortLink: "personal123",
        closed: 0,
      });

      // Verify organization was NOT processed (should not be called with orgs)
      const orgCalls = mockUpsert.mock.calls.filter(
        (call) => call[0] === "orgs"
      );
      expect(orgCalls).toHaveLength(0);
    });

    it("processes closed board without organization", async () => {
      const boardData = [
        {
          id: "board789",
          name: "Closed Personal Board",
          closed: true,
          idOrganization: null,
          idMemberCreator: "member789",
          shortLink: "closed123",
          lists: [],
          cards: [],
          members: [],
          labels: [],
          organization: null,
        },
      ];

      await sync["process"](boardData);

      // Verify board was processed with closed flag
      expect(mockUpsert).toHaveBeenCalledWith("boards", {
        id: "board789",
        name: "Closed Personal Board",
        orgId: null,
        creatorId: "member789",
        shortLink: "closed123",
        closed: 1,
      });

      // Verify organization was NOT processed
      const orgCalls = mockUpsert.mock.calls.filter(
        (call) => call[0] === "orgs"
      );
      expect(orgCalls).toHaveLength(0);
    });

    it("processes multiple boards with mixed organization status", async () => {
      const boardData = [
        {
          id: "board1",
          name: "Org Board",
          closed: false,
          idOrganization: "org1",
          idMemberCreator: "member1",
          shortLink: "org1",
          lists: [],
          cards: [],
          members: [],
          labels: [],
          organization: {
            id: "org1",
            displayName: "Org 1",
            idMemberCreator: "member1",
          },
        },
        {
          id: "board2",
          name: "Personal Board",
          closed: false,
          idOrganization: null,
          idMemberCreator: "member2",
          shortLink: "personal1",
          lists: [],
          cards: [],
          members: [],
          labels: [],
          organization: null,
        },
      ];

      await sync["process"](boardData);

      // Verify both boards were processed
      expect(mockUpsert).toHaveBeenCalledWith("boards", {
        id: "board1",
        name: "Org Board",
        orgId: "org1",
        creatorId: "member1",
        shortLink: "org1",
        closed: 0,
      });

      expect(mockUpsert).toHaveBeenCalledWith("boards", {
        id: "board2",
        name: "Personal Board",
        orgId: null,
        creatorId: "member2",
        shortLink: "personal1",
        closed: 0,
      });

      // Verify only one organization was processed
      const orgCalls = mockUpsert.mock.calls.filter(
        (call) => call[0] === "orgs"
      );
      expect(orgCalls).toHaveLength(1);
      expect(orgCalls[0][1]).toEqual({
        id: "org1",
        displayName: "Org 1",
        creatorId: "member1",
      });
    });
  });
});

export {};
