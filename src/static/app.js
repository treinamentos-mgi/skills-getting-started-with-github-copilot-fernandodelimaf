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

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability">${spotsLeft} spots left</span></p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";
        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          details.participants.forEach((email) => {
            const participantItem = document.createElement("li");

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;
            participantItem.appendChild(participantEmail);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.setAttribute("aria-label", `Cancel registration for ${email} in ${name}`);
            removeButton.title = "Cancel registration";

            const trashIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            trashIcon.setAttribute("viewBox", "0 0 24 24");
            trashIcon.setAttribute("aria-hidden", "true");
            trashIcon.setAttribute("focusable", "false");
            trashIcon.innerHTML = '<path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />';
            removeButton.appendChild(trashIcon);

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to cancel registration.");
                }

                const participantIndex = details.participants.indexOf(email);
                if (participantIndex !== -1) {
                  details.participants.splice(participantIndex, 1);
                }
                participantItem.remove();
                activityCard.querySelector(".availability").textContent =
                  `${details.max_participants - details.participants.length} spots left`;

                if (details.participants.length === 0) {
                  participantsList.remove();
                  const emptyMessage = document.createElement("p");
                  emptyMessage.className = "empty-participants";
                  emptyMessage.textContent = "No participants yet.";
                  participantsSection.appendChild(emptyMessage);
                }

                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
              } catch (error) {
                removeButton.disabled = false;
                messageDiv.textContent = error.message || "Failed to cancel registration.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error canceling registration:", error);
              }
            });

            participantItem.appendChild(removeButton);
            participantsList.appendChild(participantItem);
          });
          participantsSection.appendChild(participantsList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet.";
          participantsSection.appendChild(emptyMessage);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

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
