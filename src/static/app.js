document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear existing select options (except placeholder)
      Array.from(activitySelect.options).forEach((opt) => {
        if (opt.value) opt.remove();
      });

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Render participants list (hide bullet points via CSS)
        const participantsUl = activityCard.querySelector(".participants-list");
        if (details.participants && details.participants.length) {
          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            const initial = (participant && participant.trim().charAt(0)) ? participant.trim().charAt(0).toUpperCase() : "?";

            // Create elements
            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = initial;

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.title = `Unregister ${participant}`;
            deleteBtn.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            deleteBtn.innerHTML = "✖";

            // Attach click handler to unregister participant
            deleteBtn.addEventListener("click", async () => {
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                const resJson = await resp.json();
                if (resp.ok) {
                  // remove the list item from DOM
                  li.remove();
                } else {
                  console.error("Failed to unregister:", resJson);
                  alert(resJson.detail || "Failed to unregister participant");
                }
              } catch (err) {
                console.error(err);
                alert("Network error while unregistering participant");
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            participantsUl.appendChild(li);
          });
        } else {
          const none = document.createElement("li");
          none.className = "no-participants";
          none.textContent = "No participants yet";
          participantsUl.appendChild(none);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
